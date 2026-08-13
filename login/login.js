// =====================================
// 岩瀬自治会 防災アプリ
// 会員アクセスコード認証
// ＋ Anonymous Auth
// =====================================

"use strict";


// =====================================
// ページ読み込み
// =====================================

window.addEventListener(
    "load",
    checkLogin
);


// =====================================
// 既存セッション確認
// =====================================

async function checkLogin() {

    try {

        const {
            data,
            error
        } =
        await supabaseClient.auth.getSession();


        if (
            !error &&
            data &&
            data.session
        ) {

            console.log(
                "既存のSupabaseセッションを確認しました。"
            );


            console.log(
                "UID:",
                data.session.user.id
            );


            location.href =
                "../index.html";

        }

    }

    catch (error) {

        console.error(
            "セッション確認エラー:",
            error
        );

    }

}


// =====================================
// ログイン
// =====================================

async function login() {

    const input =
        document.getElementById(
            "access-code"
        );


    const button =
        document.getElementById(
            "login-button"
        );


    const errorElement =
        document.getElementById(
            "error-message"
        );


    const code =
        input.value.trim();


    // ==================================
    // 入力チェック
    // ==================================

    if (!code) {

        errorElement.textContent =
            "アクセスコードを入力してください。";

        return;

    }


    try {

        button.disabled = true;

        button.textContent =
            "確認中...";

        errorElement.textContent = "";


        // ==================================
        // Edge Functionでコード確認
        // ==================================

        const {
            data,
            error
        } =
        await supabaseClient.functions.invoke(
            "verify-access-code",
            {
                body: {
                    code: code
                }
            }
        );


        // ==================================
        // Functionエラー
        // ==================================

        if (error) {

            console.error(
                "アクセスコード認証エラー:",
                error
            );

            throw new Error(
                "アクセスコードの確認に失敗しました。"
            );

        }


        // ==================================
        // コード不正
        // ==================================

        if (
            !data ||
            data.success !== true
        ) {

            errorElement.textContent =
                data?.message ||
                "アクセスコードが正しくありません。";

            button.disabled = false;

            button.textContent =
                "利用開始";

            return;

        }


        // ==================================
        // Anonymous Auth
        // ==================================

        button.textContent =
            "利用開始中...";


        const {
            data: authData,
            error: authError
        } =
        await supabaseClient.auth
            .signInAnonymously();


        if (authError) {

            console.error(
                "Anonymous Auth error:",
                authError
            );

            throw authError;

        }


        if (
            !authData ||
            !authData.user
        ) {

            throw new Error(
                "Anonymous Authに失敗しました。"
            );

        }


        // ==================================
        // UID確認
        // ==================================

        console.log(
            "Anonymous Auth UID:",
            authData.user.id
        );


        console.log(
            "Anonymous:",
            authData.user.is_anonymous
        );


        // ==================================
        // トップページ
        // ==================================

        location.href =
            "../index.html";

    }


    catch (error) {

        console.error(
            "ログインエラー:",
            error
        );


        errorElement.textContent =
            error.message ||
            "ログインに失敗しました。";


        button.disabled = false;

        button.textContent =
            "利用開始";

    }

}
