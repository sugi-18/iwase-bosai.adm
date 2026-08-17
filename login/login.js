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
//
// ・24時間ログイン期限なし
// ・iwaseStampを利用者情報として使用
// ・通信エラーでは利用者情報を削除しない
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


        /*
         * 利用者情報がない
         * → 初回登録画面のまま
         */

        if (!saved) {
            return;
        }


        let userData;


        /*
         * JSON解析
         */

        try {

            userData =
                JSON.parse(saved);

        }
        catch (parseError) {

            console.error(
                "利用者データ解析エラー:",
                parseError
            );


            /*
             * 明らかに壊れたデータだけ削除
             */

            localStorage.removeItem(
                "iwaseStamp"
            );


            return;

        }


        /*
         * ID・氏名確認
         */

        if (
            !userData ||
            !userData.id ||
            !userData.name
        ) {

            console.warn(
                "利用者情報が不完全です。"
            );


            localStorage.removeItem(
                "iwaseStamp"
            );


            return;

        }


        /*
         * ==================================================
         * Supabase上に利用者が存在するか確認
         *
         * 通信エラーでは削除しない。
         * ==================================================
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


        /*
         * ==================================================
         * RPCエラー
         *
         * → 利用者情報を削除しない
         * → 既存利用者としてアプリへ進む
         * ==================================================
         */

        if (error) {

            console.warn(
                "利用者確認RPCエラー。",
                error
            );


            console.log(
                "既存利用者情報を維持してアプリを起動します:",
                userData.id
            );


            location.href =
                "../index.html";


            return;

        }


        /*
         * ==================================================
         * Supabase確認成功
         *
         * 登録済み
         * ==================================================
         */

        if (data === true) {

            console.log(
                "登録済み利用者を確認しました:",
                userData.id
            );


            location.href =
                "../index.html";


            return;

        }


        /*
         * ==================================================
         * Supabaseから正常にfalseが返った
         *
         * → 本当に存在しない場合だけ
         *   ローカル情報を削除
         * ==================================================
         */

        console.warn(
            "Supabase上に利用者が存在しません:",
            userData.id
        );


        localStorage.removeItem(
            "iwaseStamp"
        );


        return;


    }
    catch (error) {

        /*
         * ==================================================
         * 予期しないエラー
         *
         * 絶対にiwaseStampを削除しない。
         * ==================================================
         */

        console.error(
            "利用者確認エラー:",
            error
        );


        /*
         * 既存利用者情報を維持
         */

        console.warn(
            "既存の利用者情報を維持します。"
        );


        location.href =
            "../index.html";

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
        //
        // 新規登録時だけ新しいIDを作成する。
        // 既存iwaseStampはここでは上書きしない。
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
        // 既存Authセッション解除
        //
        // 一般利用者のログインには使用しない
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
