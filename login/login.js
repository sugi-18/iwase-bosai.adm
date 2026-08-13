// =====================================
// 岩瀬自治会 防災アプリ
// Anonymous Auth ログイン処理
// =====================================

"use strict";


// =====================================
// ログイン有効時間
// =====================================

const LOGIN_LIMIT =
    24 * 60 * 60 * 1000;


// =====================================
// ページ読み込み
// =====================================

window.addEventListener(
    "load",
    checkLogin
);


// =====================================
// 既にログイン済みか確認
// =====================================

async function checkLogin() {

    try {

        const loginData =
            localStorage.getItem(
                "iwaseLogin"
            );


        // ログイン情報がなければ終了

        if (!loginData) {

            return;

        }


        const data =
            JSON.parse(loginData);


        const now =
            new Date().getTime();


        // 24時間以内か確認

        if (
            data.login === true &&
            now - data.time < LOGIN_LIMIT
        ) {


            // Supabaseセッション確認

            const {
                data: sessionData,
                error
            } =
                await supabaseClient.auth.getSession();


            if (
                !error &&
                sessionData &&
                sessionData.session
            ) {

                console.log(
                    "既存のSupabaseセッションを確認しました。"
                );


                console.log(
                    "UID:",
                    sessionData.session.user.id
                );


                location.href =
                    "../index.html";


                return;

            }


            // セッションがない場合

            localStorage.removeItem(
                "iwaseLogin"
            );

        }


        else {

            // 24時間経過

            localStorage.removeItem(
                "iwaseLogin"
            );

        }

    }

    catch (error) {

        console.error(
            "ログイン状態確認エラー:",
            error
        );


        localStorage.removeItem(
            "iwaseLogin"
        );

    }

}


// =====================================
// Anonymous Auth ログイン
// =====================================

async function login() {

    const button =
        document.getElementById(
            "login-button"
        );


    const errorElement =
        document.getElementById(
            "error-message"
        );


    try {

        // ---------------------------------
        // ボタン無効化
        // ---------------------------------

        button.disabled = true;

        button.textContent =
            "認証中...";


        errorElement.textContent = "";


        // ---------------------------------
        // 既存セッション確認
        // ---------------------------------

        const {
            data: currentSession,
            error: sessionError
        } =
            await supabaseClient.auth.getSession();


        if (sessionError) {

            throw sessionError;

        }


        // ---------------------------------
        // 既存セッションがある場合
        // ---------------------------------

        if (
            currentSession &&
            currentSession.session
        ) {

            console.log(
                "既存のSupabaseセッションを使用します。"
            );


            console.log(
                "UID:",
                currentSession.session.user.id
            );


            saveLoginState();


            location.href =
                "../index.html";


            return;

        }


        // ---------------------------------
        // Anonymous Auth
        // ---------------------------------

        const {
            data,
            error: authError
        } =
            await supabaseClient.auth.signInAnonymously();


        if (authError) {

            throw authError;

        }


        // ---------------------------------
        // ユーザー確認
        // ---------------------------------

        if (
            !data ||
            !data.user
        ) {

            throw new Error(
                "匿名ユーザーの作成に失敗しました。"
            );

        }


        // ---------------------------------
        // Anonymous Auth UID
        // ---------------------------------

        console.log(
            "Anonymous Auth UID:",
            data.user.id
        );


        // ---------------------------------
        // Anonymousユーザー確認
        // ---------------------------------

        console.log(
            "Anonymous Auth:",
            data.user.is_anonymous
        );


        // ---------------------------------
        // ログイン状態保存
        // ---------------------------------

        saveLoginState();


        // ---------------------------------
        // トップページへ
        // ---------------------------------

        location.href =
            "../index.html";

    }


    catch (error) {

        console.error(
            "Anonymous Auth ログインエラー:",
            error
        );


        errorElement.textContent =
            "利用開始に失敗しました。しばらくしてからもう一度お試しください。";


        button.disabled = false;

        button.textContent =
            "利用開始";

    }

}


// =====================================
// ログイン状態保存
// =====================================

function saveLoginState() {

    const loginData = {

        login: true,

        time:
            new Date().getTime()

    };


    localStorage.setItem(

        "iwaseLogin",

        JSON.stringify(loginData)

    );

}
