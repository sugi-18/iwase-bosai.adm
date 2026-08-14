// =====================================
// 岩瀬自治会 防災アプリ
// 一般利用者 初回登録
//
// 自治会コード＋氏名
// ↓
// participants登録
// ↓
// 利用者ID保存
// ↓
// アプリ開始
//
// 一般利用者にはSupabase Authを使用しない
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
// 既存利用者確認
// =====================================

async function checkLogin() {

    try {

        const saved =
            localStorage.getItem(
                "iwaseStamp"
            );


        if (!saved) {
            return;
        }


        const userData =
            JSON.parse(saved);


        if (
            !userData ||
            !userData.id ||
            !userData.name
        ) {
            localStorage.removeItem(
                "iwaseStamp"
            );

            return;
        }


        /*
         * 端末に利用者IDが残っていても、
         * Supabase上に存在しなければ
         * 利用者として認めない。
         */

        const {
            data,
            error
        } =
        await supabaseClient.rpc(
            "check_participant_exists",
            {
                p_participant_id:
                    userData.id
            }
        );


        if (
            error ||
            data !== true
        ) {

            console.log(
                "Supabase上に利用者が存在しません。"
            );


            localStorage.removeItem(
                "iwaseStamp"
            );


            return;

        }


        /*
         * 登録済み利用者
         */

        console.log(
            "登録済み利用者を確認しました:",
            userData.id
        );


        location.href =
            "../index.html";


    }
    catch (error) {

        console.error(
            "利用者確認エラー:",
            error
        );

    }

}


// =====================================
// 利用者ID生成
// =====================================

function createParticipantId() {

    const timestamp =
        Date.now();


    const random =
        Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();


    return (
        "IWASE-" +
        timestamp +
        "-" +
        random
    );

}


// =====================================
// 利用登録
// =====================================

async function login() {

    const codeInput =
        document.getElementById(
            "access-code"
        );


    const nameInput =
        document.getElementById(
            "username"
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
        codeInput.value.trim();


    const name =
        nameInput.value.trim();


    // ==================================
    // 入力チェック
    // ==================================

    if (!code) {

        errorElement.textContent =
            "自治会コードを入力してください。";

        codeInput.focus();

        return;

    }


    if (!name) {

        errorElement.textContent =
            "氏名を入力してください。";

        nameInput.focus();

        return;

    }


    if (name.length > 100) {

        errorElement.textContent =
            "氏名が長すぎます。";

        nameInput.focus();

        return;

    }


    try {

        button.disabled =
            true;


        button.textContent =
            "確認中...";


        errorElement.textContent =
            "";


        // ==================================
        // 自治会コード確認
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


        if (error) {

            console.error(
                "自治会コード認証エラー:",
                error
            );

            throw new Error(
                "自治会コードの確認に失敗しました。"
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
                "自治会コードが正しくありません。";


            button.disabled =
                false;


            button.textContent =
                "利用登録して開始";


            return;

        }


        // ==================================
        // 利用者ID生成
        // ==================================

        const participantId =
            createParticipantId();


        button.textContent =
            "利用登録中...";


        // ==================================
        // participants登録
        //
        // 現在のRLSでanon INSERTが
        // 許可されている
        // ==================================

        const {
            error:
                insertError
        } =
        await supabaseClient
            .from("participants")
            .insert({

                participant_id:
                    participantId,

                name:
                    name

            });


        if (insertError) {

            console.error(
                "participants INSERT error:",
                insertError
            );

            throw insertError;

        }


        // ==================================
        // 端末保存
        // stamp.jsと同じ形式を使用
        // ==================================

        const userData = {

            id:
                participantId,

            name:
                name,

            stamps:
                []

        };


        localStorage.setItem(
            "iwaseStamp",
            JSON.stringify(
                userData
            )
        );


        // ==================================
        // 保存確認
        // ==================================

        const saved =
            localStorage.getItem(
                "iwaseStamp"
            );


        if (!saved) {

            throw new Error(
                "端末への利用者情報保存を確認できませんでした。"
            );

        }


        // ==================================
        // 既存のAnonymous Authがあれば
        // 一般利用者では使用しないため解除
        // ==================================

        try {

            await supabaseClient.auth.signOut();

        }
        catch (authError) {

            console.warn(
                "既存Authセッション解除警告:",
                authError
            );

        }


        // ==================================
        // アプリ開始
        // ==================================

        location.href =
            "../index.html";


    }
    catch (error) {

        console.error(
            "利用登録エラー:",
            error
        );


        let message =
            "利用登録に失敗しました。";


        if (
            error?.message
        ) {

            message +=
                "\n\n" +
                error.message;

        }


        message +=
            "\n\n" +
            "通信状態を確認して、もう一度お試しください。";


        errorElement.textContent =
            message;


        button.disabled =
            false;


        button.textContent =
            "利用登録して開始";

    }

}
