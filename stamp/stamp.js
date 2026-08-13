// ==================================================
// 岩瀬自治会 防災アプリ
// いわぽん防災マイスター スタンプカード
//
// 管理者訓練マスター連携版
// 2026-08-12
// ==================================================

"use strict";


// ==================================================
// 設定
// ==================================================

const STORAGE_KEY = "iwaseStamp";

const MAX_STAMP = 10;

const CERTIFICATE_COUNT = 5;


// ==================================================
// Supabase設定
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

        initializeSupabase();

        const registerButton =
            document.getElementById(
                "register-button"
            );

        if (registerButton) {

            registerButton.addEventListener(
                "click",
                registerUser
            );

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
                "Supabaseライブラリが読み込まれていません。"
            );

            return;

        }


        stampSupabaseClient =
            window.supabase.createClient(
                STAMP_SUPABASE_URL,
                STAMP_SUPABASE_PUBLISHABLE_KEY
            );


        console.log(
            "Stamp Supabase client initialized."
        );


    } catch (error) {

        console.error(
            "Supabase初期化エラー:",
            error
        );

    }

}


// ==================================================
// 利用者登録
// ==================================================

function registerUser() {

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


    if (name === "") {

        alert(
            "氏名を入力してください。"
        );

        username.focus();

        return;

    }


    const data = {

        id:
            "IWASE-" +
            Date.now(),

        name:
            name,

        stamps:
            []

    };


    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data)
        );


    } catch (error) {

        console.error(
            error
        );

        alert(
            "利用者情報を保存できませんでした。"
        );

        return;

    }


    displayCard(
        data
    );


    syncWithSupabase();

}


// ==================================================
// 保存データ読み込み
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
            !data.name ||
            !Array.isArray(data.stamps)
        ) {

            localStorage.removeItem(
                STORAGE_KEY
            );

            return;

        }


        displayCard(
            data
        );


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
// Supabaseと同期
//
// 管理者が変更した訓練名・実施日を
// 個人画面へ反映する。
// ==================================================

async function syncWithSupabase() {

    if (!stampSupabaseClient) {

        return;

    }


    const saved =
        localStorage.getItem(
            STORAGE_KEY
        );


    if (!saved) {

        return;

    }


    let userData;


    try {

        userData =
            JSON.parse(saved);

    } catch (error) {

        console.error(
            error
        );

        return;

    }


    if (!userData.id) {

        return;

    }


    try {

        // ------------------------------------------
        // 参加者情報をSupabaseへ登録
        // ------------------------------------------

        const {
            error: participantError
        } =
            await stampSupabaseClient
                .from("participants")
                .upsert(
                    {
                        participant_id:
                            userData.id,

                        name:
                            userData.name
                    },
                    {
                        onConflict:
                            "participant_id"
                    }
                );


        if (participantError) {

            console.error(
                "participants同期エラー:",
                participantError
            );

        }


        // ------------------------------------------
        // 現在の参加記録取得
        // ------------------------------------------

        const {
            data: participationRows,
            error: participationError
        } =
            await stampSupabaseClient
                .from("participations")
                .select(
                    "training_id"
                )
                .eq(
                    "participant_id",
                    userData.id
                );


        if (participationError) {

            throw participationError;

        }


        const participations =
            participationRows || [];


        // ------------------------------------------
        // 管理者登録済み訓練取得
        // ------------------------------------------

        const {
            data: trainingRows,
            error: trainingError
        } =
            await stampSupabaseClient
                .from("trainings")
                .select(
                    "*"
                );


        if (trainingError) {

            throw trainingError;

        }


        const trainings =
            trainingRows || [];


        // ------------------------------------------
        // 参加記録を現在の訓練情報に変換
        // ------------------------------------------

        const stamps = [];


        participations.forEach(
            participation => {

                const training =
                    trainings.find(
                        item =>
                            String(
                                item.training_id
                            ) ===
                            String(
                                participation.training_id
                            )
                    );


                // 管理者側で訓練が削除されていた場合
                // 個人カードには表示しない
                if (!training) {

                    return;

                }


                const trainingDate =
                    training.training_date ||
                    training.date ||
                    "";


                const trainingTitle =
                    training.title ||
                    "防災訓練";


                stamps.push({

                    training_id:
                        training.training_id,

                    date:
                        trainingDate,

                    event:
                        trainingTitle

                });

            }
        );


        // ------------------------------------------
        // 最大10個
        // ------------------------------------------

        userData.stamps =
            stamps.slice(
                0,
                MAX_STAMP
            );


        // ------------------------------------------
        // localStorage更新
        // ------------------------------------------

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(userData)
        );


        // ------------------------------------------
        // 画面更新
        // ------------------------------------------

        displayCard(
            userData
        );


    } catch (error) {

        console.error(
            "Supabase同期エラー:",
            error
        );

    }

}


// ==================================================
// 参加した訓練一覧
//
// 管理者が登録しただけの訓練は表示しない。
// participations に存在する training_id のみ表示する。
// ==================================================

async function loadTrainingList() {

    const container =
        document.getElementById(
            "training-list"
        );


    if (!container) {
        return;
    }


    if (!stampSupabaseClient) {

        container.innerHTML =
            "<p>訓練情報を読み込めませんでした。</p>";

        return;

    }


    container.innerHTML =
        "<p>参加した訓練を読み込んでいます……</p>";


    try {

        // ==================================================
        // 現在の利用者
        // ==================================================

        const saved =
            localStorage.getItem(
                STORAGE_KEY
            );


        if (!saved) {

            container.innerHTML =
                "<p>参加した訓練はありません。</p>";

            return;

        }


        const userData =
            JSON.parse(saved);


        if (
            !userData ||
            !userData.id
        ) {

            container.innerHTML =
                "<p>参加した訓練はありません。</p>";

            return;

        }


        const participantId =
            String(
                userData.id
            ).trim();


        // ==================================================
        // 参加記録を取得
        // ==================================================

        const {
            data:
                participationRows,
            error:
                participationError
        } =
            await stampSupabaseClient
                .from(
                    "participations"
                )
                .select(
                    "training_id"
                )
                .eq(
                    "participant_id",
                    participantId
                );


        if (
            participationError
        ) {

            throw participationError;

        }


        const participations =
            participationRows || [];


        // ==================================================
        // 参加記録がない場合
        // ==================================================

        if (
            participations.length === 0
        ) {

            container.innerHTML =
                "<p>参加した訓練はありません。</p>";

            return;

        }


        // ==================================================
        // 訓練情報取得
        // ==================================================

        const {
            data:
                trainingRows,
            error:
                trainingError
        } =
            await stampSupabaseClient
                .from(
                    "trainings"
                )
                .select("*");


        if (
            trainingError
        ) {

            throw trainingError;

        }


        const trainings =
            trainingRows || [];


        // ==================================================
        // 参加した訓練だけ抽出
        // ==================================================

        const participatedTrainings =
            participations
                .map(
                    participation => {

                        return trainings.find(
                            training =>
                                String(
                                    training.training_id
                                ) ===
                                String(
                                    participation.training_id
                                )
                        );

                    }
                )
                .filter(
                    training =>
                        !!training
                );


        // ==================================================
        // 表示
        // ==================================================

        container.innerHTML =
            "";


        if (
            participatedTrainings.length === 0
        ) {

            container.innerHTML =
                "<p>参加した訓練はありません。</p>";

            return;

        }


        participatedTrainings.forEach(
            training => {

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
                    training.title ||
                    "防災訓練";


                const date =
                    document.createElement(
                        "div"
                    );


                date.textContent =
                    formatTrainingDate(
                        training.training_date ||
                        training.date
                    );


                item.appendChild(
                    title
                );


                item.appendChild(
                    date
                );


                container.appendChild(
                    item
                );

            }
        );


    } catch (error) {

        console.error(
            "参加訓練一覧取得エラー:",
            error
        );


        container.innerHTML =
            "<p>参加した訓練を取得できませんでした。</p>";

    }

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
        parts.length === 3
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
    // 参加履歴
    // ------------------------------------------

    displayHistory(
        data
    );


    // ------------------------------------------
    // 管理者登録済み訓練
    // ------------------------------------------

    loadTrainingList();

}


// ==================================================
// 参加履歴表示
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
        data.stamps.length === 0
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
// データ削除
//
// ・Supabaseの参加記録削除
// ・Supabaseの参加者情報削除
// ・端末のスタンプカード削除
// ・ログイン情報削除
// ・ログイン画面へ戻る
// ==================================================

async function clearData() {

    const result =
        confirm(
            "登録したデータとログイン情報をすべて削除しますか？\n\n" +
            "削除すると、最初のログイン画面からやり直せます。"
        );

    if (!result) {
        return;
    }


    // ==================================================
    // 現在の参加者情報を取得
    // ==================================================

    let userData = null;

    const saved =
        localStorage.getItem(
            STORAGE_KEY
        );

    if (saved) {

        try {

            userData =
                JSON.parse(saved);

        } catch (error) {

            console.error(
                "利用者データ解析エラー:",
                error
            );

        }

    }


    // ==================================================
    // Supabaseのデータ削除
    // ==================================================

    if (
        stampSupabaseClient &&
        userData &&
        userData.id
    ) {

        try {

            const participantId =
                String(
                    userData.id
                ).trim();


            // ------------------------------------------
            // ① 参加記録を削除
            // ------------------------------------------

            const {
                error:
                    participationDeleteError
            } =
                await stampSupabaseClient
                    .from(
                        "participations"
                    )
                    .delete()
                    .eq(
                        "participant_id",
                        participantId
                    );


            if (
                participationDeleteError
            ) {

                console.error(
                    "参加記録削除エラー:",
                    participationDeleteError
                );

                throw participationDeleteError;

            }


            // ------------------------------------------
            // ② 参加者情報を削除
            // ------------------------------------------

            const {
                error:
                    participantDeleteError
            } =
                await stampSupabaseClient
                    .from(
                        "participants"
                    )
                    .delete()
                    .eq(
                        "participant_id",
                        participantId
                    );


            if (
                participantDeleteError
            ) {

                console.error(
                    "参加者情報削除エラー:",
                    participantDeleteError
                );

                throw participantDeleteError;

            }


        } catch (error) {

            console.error(
                "Supabaseデータ削除エラー:",
                error
            );

            alert(
                "Supabase上のデータ削除に失敗しました。\n\n" +
                (
                    error.message ||
                    "不明なエラー"
                ) +
                "\n\n" +
                "ログイン情報は削除せず処理を中止しました。"
            );

            return;

        }

    }


    // ==================================================
    // 端末内データ削除
    // ==================================================

    // スタンプカード
    localStorage.removeItem(
        STORAGE_KEY
    );


    // 防災アプリログイン情報
    localStorage.removeItem(
        "iwaseLogin"
    );


    // 旧ログイン方式
    localStorage.removeItem(
        "role"
    );


    // ==================================================
    // 完了
    // ==================================================

    alert(
        "データとログイン情報を削除しました。\n\n" +
        "ログイン画面に戻ります。"
    );


    // ==================================================
    // ログイン画面へ
    // ==================================================

    location.href =
        "../login/login.html";

}
