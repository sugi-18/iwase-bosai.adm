// =====================================
// 岩瀬自治会 防災アプリ
// Anonymous Auth ログイン処理
// =====================================

"use strict";


// =====================================
// ログイン有効時間
//
// UI上のログイン状態を24時間保持
// Supabase Authのセッション自体は保持する
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
// Supabaseクライアント確認
// =====================================

function getSupabaseClient() {

    if (
        typeof supabase === "undefined"
    ) {

        throw new Error(
            "Supabaseライブラリが読み込まれていません。"
        );

    }


    if (
        typeof window.supabaseClient === "undefined"
    ) {

        throw new Error(
            "Supabaseクライアントが初期化されていません。"
        );

    }


    return window.supabaseClient;

}


// =====================================
// 既にログイン済みか確認
// =====================================

async function checkLogin() {

    try {

        const loginData =
            localStorage.getItem(
                "iwaseLogin"
            );


        // ---------------------------------
        // localStorageにログイン情報がない
        // ---------------------------------

        if (!loginData) {

            return;

        }


        const data =
            JSON.parse(loginData);


        const now =
            new Date().getTime();


        // ---------------------------------
        // 24時間以内
        // ---------------------------------

        if (
            data.login === true &&
            now - data.time < LOGIN_LIMIT
        ) {

            // Supabaseセッション確認

            const client =
                getSupabaseClient();


            const {
                data: sessionData,
                error
            } =
                await client.auth.getSession();


            if (
                !error &&
                sessionData &&
                sessionData.session
            ) {

                location.href =
                    "../index.html";

                return;

            }


            // ---------------------------------
            // セッションがなければ
            // localStorageを削除
            // ---------------------------------

            localStorage.removeItem(
                "iwaseLogin"
            );

        }


        else {

            // ---------------------------------
            // 24時間経過
            // ---------------------------------

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


    const error =
        document.getElementById(
            "error-message"
        );


    try {

        // ---------------------------------
        // ボタンを無効化
        // ---------------------------------

        button.disabled = true;

        button.textContent =
            "認証中...";


        error.textContent = "";


        // ---------------------------------
        // Supabaseクライアント
        // ---------------------------------

        const client =
            getSupabaseClient();


        // ---------------------------------
        // すでにセッションがあるか確認
        // ---------------------------------

        const {
            data: currentSession,
            error: sessionError
        } =
            await client.auth.getSession();


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
            await client.auth.signInAnonymously();


        if (authError) {

            throw authError;

        }


        if (
            !data ||
            !data.user
        ) {

            throw new Error(
                "匿名ユーザーの作成に失敗しました。"
            );

        }


        // ---------------------------------
        // UID確認
        // ---------------------------------

        console.log(
            "Anonymous Auth UID:",
            data.user.id
        );


        // ---------------------------------
        // ログイン状態保存
        // ---------------------------------

        saveLoginState();


        // ---------------------------------
        // トップページ
        // ---------------------------------

        location.href =
            "../index.html";


    }

    catch (error) {

        console.error(
            "Anonymous Auth ログインエラー:",
            error
        );


        error.textContent =
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
