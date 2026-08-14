// ==================================================
// 岩瀬自治会 防災アプリ
// いわぽん防災マイスター スタンプカード
//
// 完成版
//
// ・iPhone / Android / PC / iPad 対応
// ・Supabase Authを一般利用者には使用しない
// ・スタンプカード専用Supabaseクライアント
// ・参加者登録
// ・参加履歴同期
// ・訓練情報同期
// ・QRコード表示
// ・最大10スタンプ
// ・5スタンプで認定
// ・完全退会処理
// ==================================================

"use strict";


// ==================================================
// 設定
// ==================================================

const STORAGE_KEY = "iwaseStamp";

const MAX_STAMP = 10;

const CERTIFICATE_COUNT = 5;


// ==================================================
// Supabase
// ==================================================

const STAMP_SUPABASE_URL =
    "https://zumbqukrojdpgfpfekjr.supabase.co";

const STAMP_SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_8YXsMHOxLr7MOTEYShUM3w_LsZvR3Qn";

let stampSupabaseClient = null;


// ==================================================
// 初期化
// ==================================================

window.addEventListener(
    "DOMContentLoaded",
    async function () {

        const initialized =
            initializeSupabase();


        if (!initialized) {

            showStampAccessBlocked(
                "サーバーに接続できません。\n\n" +
                "通信状態を確認してください。"
            );

            return;

        }


        // ------------------------------------------
        // 既存利用者確認
        // ------------------------------------------

       window.addEventListener(
    "DOMContentLoaded",
    async function () {

        const initialized =
            initializeSupabase();

        if (!initialized) {

            showStampAccessBlocked(
                "サーバーに接続できません。\n\n" +
                "通信状態を確認してください。"
            );

            return;
        }

        // ------------------------------------------
        // 本体からの正規アクセス確認
        // ------------------------------------------

        const stampAccess =
            sessionStorage.getItem(
                "iwaseStampAccess"
            );

        if (stampAccess !== "1") {

            showStampAccessBlocked(
                "このスタンプカードは、\n" +
                "防災アプリ本体からアクセスしてください。"
            );

            return;
        }

        // ------------------------------------------
        // 入場フラグは一度使ったら削除
        // ------------------------------------------

        sessionStorage.removeItem(
            "iwaseStampAccess"
        );

        // ------------------------------------------
        // 利用者登録済みデータを読み込む
        // ------------------------------------------

        loadCard();

    }
);


        // ------------------------------------------
        // 登録済み利用者
        // ------------------------------------------

        const registerButton =
            document.getElementById(
                "register-button"
            );


        if (registerButton) {

            registerButton.style.display =
                "none";

        }


        const registerArea =
            document.getElementById(
                "register-area"
            );


        if (registerArea) {

            registerArea.style.display =
                "none";

        }


        loadCard();

    }
);


// ==================================================
// Supabase初期化
// ==================================================

function initializeSupabase() {

    try {

        if (
            typeof window.supabase ===
            "undefined"
        ) {

            console.error(
                "Supabase JSライブラリが読み込まれていません。"
            );

            stampSupabaseClient = null;

            return false;

        }


        stampSupabaseClient =
            window.supabase.createClient(
                STAMP_SUPABASE_URL,
                STAMP_SUPABASE_PUBLISHABLE_KEY,
                {
                    auth: {

                        persistSession:
                            false,

                        autoRefreshToken:
                            false,

                        detectSessionInUrl:
                            false

                    }
                }
            );


        console.log(
            "Stamp Supabase client initialized."
        );


        return true;


    } catch (error) {

        console.error(
            "Supabase初期化エラー:",
            error
        );

        stampSupabaseClient = null;

        return false;

    }

}


// ==================================================
// 利用者ID生成
// ==================================================

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


// ==================================================
// 利用者登録
// ==================================================
async function registerUser() {

    alert(
        "この画面から利用者登録はできません。\n\n" +
        "先にアプリの利用者登録を行ってください。"
    );

    return;


    // ↓↓↓ 以下の既存処理 ↓↓↓

async function registerUser() {

    const username =
        document.getElementById(
            "username"
        );


    if (!username) {

        alert(
            "氏名入力欄が見つかりません。"
        );

        return;

    }


    const name =
        username.value.trim();


    if (!name) {

        alert(
            "氏名を入力してください。"
        );

        username.focus();

        return;

    }


    if (!stampSupabaseClient) {

        alert(
            "サーバーに接続できません。\n\n" +
            "通信状態を確認して、もう一度お試しください。"
        );

        return;

    }


    const registerButton =
        document.getElementById(
            "register-button"
        );


    if (registerButton) {

        registerButton.disabled =
            true;

        registerButton.textContent =
            "登録中……";

    }


    const participantId =
        createParticipantId();


    const data = {

        id:
            participantId,

        name:
            name,

        stamps:
            []

    };


    try {

        // ------------------------------------------
        // participants INSERT
        //
        // SELECTは行わない
        // ------------------------------------------

        const {
            error
        } =
            await stampSupabaseClient
                .from("participants")
                .insert({

                    participant_id:
                        participantId,

                    name:
                        name

                });


        if (error) {

            console.error(
                "participants INSERT error:",
                error
            );

            throw error;

        }


        // ------------------------------------------
        // localStorage
        // ------------------------------------------

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data)
        );


        // ------------------------------------------
        // 保存確認
        // ------------------------------------------

        const verify =
            localStorage.getItem(
                STORAGE_KEY
            );


        if (!verify) {

            throw new Error(
                "端末への保存を確認できませんでした。"
            );

        }


        // ------------------------------------------
        // 表示
        // ------------------------------------------

        displayCard(
            data
        );


        console.log(
            "利用者登録完了:",
            participantId
        );


    } catch (error) {

        console.error(
            "利用者登録エラー:",
            error
        );


        let message =
            "利用者登録に失敗しました。";


        if (error?.message) {

            message +=
                "\n\n" +
                error.message;

        }


        message +=
            "\n\n" +
            "通信状態を確認して、もう一度お試しください。";


        alert(
            message
        );


        if (registerButton) {

            registerButton.disabled =
                false;

            registerButton.textContent =
                "登録する";

        }

    }

}


// ==================================================
// localStorage読み込み
// ==================================================

function loadCard() {

    const saved =
        localStorage.getItem(
            STORAGE_KEY
        );


    if (!saved) {

        return;

    }


    try {

        const data =
            JSON.parse(saved);


        if (
            !data ||
            !data.id ||
            !data.name
        ) {

            localStorage.removeItem(
                STORAGE_KEY
            );

            return;

        }


        if (
            !Array.isArray(
                data.stamps
            )
        ) {

            data.stamps = [];

        }


        // 最大10件
        data.stamps =
            data.stamps.slice(
                0,
                MAX_STAMP
            );


        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data)
        );


        displayCard(
            data
        );


        // バックグラウンド同期
        syncWithSupabase();


    } catch (error) {

        console.error(
            "カードデータ読み込みエラー:",
            error
        );


        localStorage.removeItem(
            STORAGE_KEY
        );

    }

}


// ==================================================
// Supabase同期
// ==================================================

async function syncWithSupabase() {

    if (!stampSupabaseClient) {
        return;
    }

    const saved =
        localStorage.getItem(STORAGE_KEY);

    if (!saved) {
        return;
    }

    let userData;

    try {
        userData = JSON.parse(saved);
    } catch (error) {
        console.error(
            "利用者データ解析エラー:",
            error
        );
        return;
    }

    if (!userData || !userData.id) {
        return;
    }

    const participantId =
        String(userData.id).trim();

    try {

        console.log(
            "Supabaseスタンプ同期開始:",
            participantId
        );

        const {
            data,
            error
        } =
            await stampSupabaseClient.rpc(
                "get_participant_stamps",
                {
                    p_participant_id:
                        participantId
                }
            );

        if (error) {
            console.error(
                "スタンプ取得RPCエラー:",
                error
            );
            throw error;
        }

        console.log(
            "スタンプ取得RPC結果:",
            data
        );

        if (!data) {
            throw new Error(
                "Supabaseからスタンプ情報を取得できませんでした。"
            );
        }

        if (data.success !== true) {
            throw new Error(
                data.error ||
                "unknown_error"
            );
        }

        let stamps =
            Array.isArray(data.stamps)
                ? data.stamps
                : [];

        stamps =
            stamps
                .map(stamp => {

                    if (!stamp) {
                        return null;
                    }

                    const trainingId =
                        String(
                            stamp.training_id ||
                            ""
                        ).trim();

                    if (!trainingId) {
                        return null;
                    }

                    return {
                        training_id:
                            trainingId,

                        date:
                            stamp.date || "",

                        event:
                            stamp.event ||
                            "防災訓練"
                    };

                })
                .filter(
                    stamp => !!stamp
                );

        const uniqueStamps = [];
        const usedTrainingIds = new Set();

        stamps.forEach(stamp => {

            if (
                usedTrainingIds.has(
                    stamp.training_id
                )
            ) {
                return;
            }

            usedTrainingIds.add(
                stamp.training_id
            );

            uniqueStamps.push(stamp);

        });

        uniqueStamps.sort(
            (a, b) => {

                const dateA =
                    String(a.date || "");

                const dateB =
                    String(b.date || "");

                return dateB.localeCompare(
                    dateA
                );

            }
        );

        userData.stamps =
            uniqueStamps.slice(
                0,
                MAX_STAMP
            );

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(userData)
        );

        displayCard(userData);

        console.log(
            "Supabase同期完了:",
            {
                participant_id:
                    participantId,

                stamp_count:
                    userData.stamps.length,

                stamps:
                    userData.stamps
            }
        );

    } catch (error) {

        console.error(
            "Supabase同期エラー:",
            error
        );

        // 同期失敗時はlocalStorageを維持
    }

}

// ==================================================
// 参加した訓練一覧
// ==================================================

async function loadTrainingList() {

    const container =
        document.getElementById(
            "training-list"
        );

    if (!container) {
        return;
    }

    const saved =
        localStorage.getItem(
            STORAGE_KEY
        );

    if (!saved) {

        container.innerHTML =
            "<p>参加した訓練はありません。</p>";

        return;
    }

    let userData;

    try {

        userData =
            JSON.parse(saved);

    } catch (error) {

        console.error(
            "訓練一覧データ解析エラー:",
            error
        );

        container.innerHTML =
            "<p>参加した訓練を読み込めませんでした。</p>";

        return;
    }

    const stamps =
        Array.isArray(userData.stamps)
            ? userData.stamps
            : [];

    if (stamps.length === 0) {

        container.innerHTML =
            "<p>参加した訓練はありません。</p>";

        return;
    }

    container.innerHTML = "";

    stamps.forEach(stamp => {

        const item =
            document.createElement(
                "div"
            );

        item.className =
            "training-item";

        const title =
            document.createElement(
                "strong"
            );

        title.textContent =
            stamp.event ||
            "防災訓練";

        const date =
            document.createElement(
                "div"
            );

        date.textContent =
            formatTrainingDate(
                stamp.date
            );

        item.appendChild(title);
        item.appendChild(date);

        container.appendChild(item);

    });

}

// ==================================================
// 日付表示
// ==================================================

function formatTrainingDate(
    date
) {

    if (!date) {

        return "";

    }


    const value =
        String(date);


    const parts =
        value.split("-");


    if (
        parts.length ===
        3
    ) {

        return (
            parts[0] +
            "年" +
            Number(parts[1]) +
            "月" +
            Number(parts[2]) +
            "日"
        );

    }


    return value;

}


// ==================================================
// スタンプカード表示
// ==================================================

function displayCard(
    data
) {

    if (!data) {

        return;

    }


    if (
        !Array.isArray(
            data.stamps
        )
    ) {

        data.stamps = [];

    }


    // 最大10件
    data.stamps =
        data.stamps.slice(
            0,
            MAX_STAMP
        );


    // ------------------------------------------
    // 登録エリア
    // ------------------------------------------

    const registerArea =
        document.getElementById(
            "register-area"
        );


    const cardArea =
        document.getElementById(
            "card-area"
        );


    if (registerArea) {

        registerArea.style.display =
            "none";

    }


    if (cardArea) {

        cardArea.style.display =
            "block";

    }


    // ------------------------------------------
    // 氏名
    // ------------------------------------------

    const userName =
        document.getElementById(
            "user-name"
        );


    if (userName) {

        userName.textContent =
            data.name +
            " さん";

    }


    // ------------------------------------------
    // QRコード
    // ------------------------------------------

    const qrArea =
        document.getElementById(
            "qrcode"
        );


    if (qrArea) {

        qrArea.innerHTML =
            "";


        if (
            typeof QRCode !==
            "undefined"
        ) {

            try {

                new QRCode(
                    qrArea,
                    {
                        text:
                            data.id,

                        width:
                            180,

                        height:
                            180
                    }
                );

            } catch (error) {

                console.error(
                    "QRコード生成エラー:",
                    error
                );

                qrArea.textContent =
                    "QRコードを表示できませんでした。";

            }

        } else {

            qrArea.textContent =
                "QRコードを読み込めませんでした。";

        }

    }


    // ------------------------------------------
    // ID
    // ------------------------------------------

    const userId =
        document.getElementById(
            "user-id"
        );


    if (userId) {

        userId.textContent =
            "ID : " +
            data.id;

    }


    // ------------------------------------------
    // スタンプ
    // ------------------------------------------

    const icons =
        document.getElementById(
            "stamp-icons"
        );


    if (icons) {

        icons.innerHTML =
            "";


        for (
            let i = 0;
            i < MAX_STAMP;
            i++
        ) {

            const span =
                document.createElement(
                    "span"
                );


            span.textContent =
                i <
                data.stamps.length
                    ? "⭐"
                    : "☆";


            icons.appendChild(
                span
            );

        }

    }


    // ------------------------------------------
    // スタンプ数
    // ------------------------------------------

    const stampCount =
        document.getElementById(
            "stamp-count"
        );


    if (stampCount) {

        stampCount.textContent =
            data.stamps.length;

    }


    // ------------------------------------------
    // 認定判定
    // ------------------------------------------

    const message =
        document.getElementById(
            "message"
        );


    const certificateArea =
        document.getElementById(
            "certificate-area"
        );


    if (
        data.stamps.length >=
        CERTIFICATE_COUNT
    ) {

        if (message) {

            message.textContent =
                "🎉 いわぽん防災マイスター認定条件達成！";

        }


        if (certificateArea) {

            certificateArea.style.display =
                "block";

        }

    } else {

        const remaining =
            CERTIFICATE_COUNT -
            data.stamps.length;


        if (message) {

            message.textContent =
                "認定まであと " +
                remaining +
                " 個です";

        }


        if (certificateArea) {

            certificateArea.style.display =
                "none";

        }

    }


    // ------------------------------------------
    // 履歴
    // ------------------------------------------

    displayHistory(
        data
    );


    // ------------------------------------------
    // 訓練一覧
    // ------------------------------------------

    loadTrainingList();

}


// ==================================================
// 参加履歴
// ==================================================

function displayHistory(
    data
) {

    const historyList =
        document.getElementById(
            "history-list"
        );


    if (!historyList) {

        return;

    }


    historyList.innerHTML =
        "";


    if (
        !data.stamps ||
        data.stamps.length ===
        0
    ) {

        const li =
            document.createElement(
                "li"
            );


        li.textContent =
            "参加履歴はありません。";


        historyList.appendChild(
            li
        );


        return;

    }


    data.stamps.forEach(
        stamp => {

            const li =
                document.createElement(
                    "li"
                );


            const dateText =
                document.createElement(
                    "div"
                );


            dateText.textContent =
                formatTrainingDate(
                    stamp.date
                );


            const eventText =
                document.createElement(
                    "div"
                );


            eventText.textContent =
                stamp.event ||
                "防災訓練";


            li.appendChild(
                dateText
            );


            li.appendChild(
                eventText
            );


            historyList.appendChild(
                li
            );

        }
    );

}


// ==================================================
// 完全退会
//
// Supabase RPC
//   ↓
// participations削除
//   ↓
// participants削除
//   ↓
// 端末データ削除
// ==================================================

async function clearData() {

    const result =
        confirm(
            "スタンプカードを完全に削除しますか？\n\n" +
            "この操作を行うと、この端末の情報だけでなく、\n" +
            "Supabaseに保存されている参加者情報と\n" +
            "参加履歴も削除します。\n\n" +
            "削除後は元に戻せません。"
        );


    if (!result) {
        return;
    }


    if (!stampSupabaseClient) {

        alert(
            "サーバーに接続できないため、退会処理を実行できません。\n\n" +
            "通信状態を確認して、もう一度お試しください。"
        );

        return;

    }


    const saved =
        localStorage.getItem(
            STORAGE_KEY
        );


    if (!saved) {

        localStorage.removeItem(
            STORAGE_KEY
        );

        localStorage.removeItem(
            "iwaseLogin"
        );

        localStorage.removeItem(
            "role"
        );

        location.href =
            "../login/login.html";

        return;

    }


    let userData;


    try {

        userData =
            JSON.parse(saved);

    }
    catch (error) {

        console.error(
            "退会データ解析エラー:",
            error
        );

        alert(
            "利用者データを確認できませんでした。\n\n" +
            "安全のため、端末データは削除していません。"
        );

        return;

    }


    const participantId =
        String(
            userData.id || ""
        ).trim();


    const participantName =
        String(
            userData.name || ""
        ).trim();


    if (!participantId) {

        alert(
            "利用者IDを確認できませんでした。\n\n" +
            "安全のため、退会処理を中止しました。"
        );

        return;

    }


    if (!participantName) {

        alert(
            "利用者名を確認できませんでした。\n\n" +
            "安全のため、退会処理を中止しました。"
        );

        return;

    }


    try {

        /*
         * ==========================================
         * Supabase退会RPC
         *
         * participant_id + name が一致した
         * 利用者だけを削除
         * ==========================================
         */

        const {
            data,
            error
        } =
            await stampSupabaseClient.rpc(
                "delete_my_participant",
                {
                    p_participant_id:
                        participantId,

                    p_name:
                        participantName
                }
            );


        if (error) {

            console.error(
                "完全退会RPCエラー:",
                error
            );

            throw new Error(
                error.message ||
                "Supabaseの退会処理に失敗しました。"
            );

        }


        console.log(
            "完全退会RPC結果:",
            data
        );


        /*
         * RPCが成功したか確認
         */

        if (
            !data ||
            data.success !== true
        ) {

            const rpcError =
                data?.error ||
                "unknown_error";


            if (
                rpcError ===
                "participant_not_found"
            ) {

                throw new Error(
                    "Supabase上に一致する利用者情報がありません。\n\n" +
                    "すでに退会済みの可能性があります。"
                );

            }


            throw new Error(
                "Supabaseの退会処理が完了しませんでした。\n\n" +
                rpcError
            );

        }


        /*
         * ==========================================
         * Supabase削除成功
         *
         * ここまで成功して初めて
         * 端末データを削除する
         * ==========================================
         */

        localStorage.removeItem(
            STORAGE_KEY
        );


        localStorage.removeItem(
            "iwaseLogin"
        );


        localStorage.removeItem(
            "role"
        );


        /*
         * 完了
         */

        alert(
            "退会処理が完了しました。\n\n" +
            "参加者情報・参加履歴・端末内データを削除しました。"
        );


        location.href =
            "../login/login.html";


    }
    catch (error) {

        console.error(
            "完全退会エラー:",
            error
        );


        /*
         * Supabase削除に失敗した場合は
         * localStorageを削除しない。
         *
         * これにより、
         * 「Supabaseには残っているのに
         * 端末だけ退会済み」
         * という不整合を防ぐ。
         */

        alert(
            "退会処理を完了できませんでした。\n\n" +
            (
                error?.message ||
                "Supabaseの削除処理に失敗しました。"
            ) +
            "\n\n" +
            "端末内のデータは削除していません。"
        );

    }

}


// ==================================================
// グローバル公開
//
// HTMLのonclickから呼び出している場合に対応
// ==================================================

window.clearData =
    clearData;

window.registerUser =
    registerUser;

window.loadCard =
    loadCard;

window.loadTrainingList =
    loadTrainingList;

window.syncWithSupabase =
    syncWithSupabase;

// ==================================================
// スタンプカード利用者確認
//
// 一般利用者の新規登録入口として
// stamp.htmlを使用させない。
//
// participantsに存在する利用者だけ
// スタンプカードを表示する。
// ==================================================

async function verifyRegisteredParticipantForStamp() {

    const saved =
        localStorage.getItem(
            STORAGE_KEY
        );


    // ------------------------------------------
    // localStorageなし
    // ------------------------------------------

    if (!saved) {

        return {

            success:
                false,

            error:
                "participant_not_registered",

            message:
                "この端末は利用者登録されていません。\n\n" +
                "先にアプリの利用者登録を行ってください。\n\n" +
                "この画面から新規利用者登録はできません。"

        };

    }


    // ------------------------------------------
    // JSON解析
    // ------------------------------------------

    let userData;


    try {

        userData =
            JSON.parse(
                saved
            );

    }
    catch (error) {

        console.error(
            "スタンプ利用者情報解析エラー:",
            error
        );


        return {

            success:
                false,

            error:
                "invalid_local_data",

            message:
                "利用者情報を確認できませんでした。\n\n" +
                "この画面から新規利用者登録はできません。"

        };

    }


    // ------------------------------------------
    // 利用者ID確認
    // ------------------------------------------

    const participantId =
        String(
            userData?.id || ""
        ).trim();


    if (!participantId) {

        return {

            success:
                false,

            error:
                "participant_id_missing",

            message:
                "利用者IDを確認できませんでした。\n\n" +
                "この画面から新規利用者登録はできません。"

        };

    }


    // ------------------------------------------
    // Supabase存在確認
    // ------------------------------------------

    try {

        const {
            data,
            error
        } =
            await stampSupabaseClient.rpc(
                "check_participant_exists",
                {
                    p_participant_id:
                        participantId
                }
            );


        if (error) {

            console.error(
                "スタンプ利用者確認RPCエラー:",
                error
            );


            return {

                success:
                    false,

                error:
                    "participant_check_error",

                message:
                    "利用者情報を確認できませんでした。\n\n" +
                    "通信状態を確認してください。"

            };

        }


        if (data !== true) {

            return {

                success:
                    false,

                error:
                    "participant_not_registered",

                message:
                    "この端末の利用者登録は確認できませんでした。\n\n" +
                    "この画面から新規利用者登録はできません。"

            };

        }


        return {

            success:
                true,

            participantId:
                participantId

        };


    }
    catch (error) {

        console.error(
            "スタンプ利用者確認例外:",
            error
        );


        return {

            success:
                false,

            error:
                "participant_check_exception",

            message:
                "利用者情報を確認できませんでした。\n\n" +
                "通信状態を確認してください。"

        };

    }

}


// ==================================================
// スタンプカード利用不可表示
// ==================================================

function showStampAccessBlocked(
    message
) {

    const registerArea =
        document.getElementById(
            "register-area"
        );


    const cardArea =
        document.getElementById(
            "card-area"
        );


    const deleteArea =
        document.getElementById(
            "delete-area"
        );


    if (registerArea) {

        registerArea.style.display =
            "none";

    }


    if (cardArea) {

        cardArea.style.display =
            "none";

    }


    if (deleteArea) {

        deleteArea.style.display =
            "none";

    }


    // ------------------------------------------
    // 既存メッセージがあれば使用
    // ------------------------------------------

    let blocked =
        document.getElementById(
            "stamp-access-blocked"
        );


    if (!blocked) {

        blocked =
            document.createElement(
                "section"
            );


        blocked.id =
            "stamp-access-blocked";


        blocked.style.marginTop =
            "30px";


        blocked.style.padding =
            "20px";


        blocked.style.border =
            "1px solid #ccc";


        blocked.style.borderRadius =
            "10px";


        blocked.style.background =
            "#f8f8f8";


        blocked.style.whiteSpace =
            "pre-line";


        const container =
            document.querySelector(
                ".stamp-container"
            );


        if (container) {

            container.appendChild(
                blocked
            );

        }

    }


    blocked.textContent =
        message;


}
