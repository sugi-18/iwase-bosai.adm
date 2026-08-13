// ==================================================
// 岩瀬自治会 防災アプリ
// いわぽん防災マイスター スタンプカード
//
// iPad対応・Supabase登録確認強化版
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
//
// supabase.jsで作成した共通クライアントを使用する。
// Supabaseクライアントを二重生成しない。
// ==================================================

function initializeSupabase() {

    try {

        // --------------------------------------------------
        // supabase.jsで作成済みのクライアントを使用
        // --------------------------------------------------

        if (
            typeof supabaseClient !==
            "undefined"
        ) {

            stampSupabaseClient =
                supabaseClient;


            console.log(
                "Stamp Supabase client initialized using shared client."
            );


            return true;

        }


        // --------------------------------------------------
        // 共通クライアントが存在しない場合
        // --------------------------------------------------

        console.error(
            "共有Supabaseクライアントが見つかりません。"
        );


        stampSupabaseClient =
            null;


        return false;


    } catch (error) {

        console.error(
            "Supabase初期化エラー:",
            error
        );


        stampSupabaseClient =
            null;


        return false;

    }

}

// ==================================================
// 利用者登録
//
// Supabaseへの登録成功を確認してから
// localStorageへ保存する。
// ==================================================

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


    if (name === "") {

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


    // ==================================================
    // 利用者ID
    // ==================================================

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

// ==================================================
// Supabase participantsへ新規登録
//
// 一般利用者はログインしていないため
// INSERTのみ実行する。
// ==================================================

const {
    error:
        participantError
} =
    await stampSupabaseClient
        .from(
            "participants"
        )
        .insert(
            {
                participant_id:
                    data.id,

                name:
                    data.name
            }
        );


// ==================================================
// Supabase登録エラー確認
// ==================================================

if (participantError) {

    throw participantError;

}



        // ==================================================
        // localStorage保存
        // ==================================================

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data)
        );


        // ==================================================
        // localStorage保存確認
        // ==================================================

        const verifySaved =
            localStorage.getItem(
                STORAGE_KEY
            );


        if (!verifySaved) {

            throw new Error(
                "端末への保存を確認できませんでした。"
            );

        }


        // ==================================================
        // 画面表示
        // ==================================================

        displayCard(
            data
        );


        console.log(
            "利用者登録完了:",
            data
        );


    } catch (error) {

        console.error(
            "利用者登録エラー:",
            error
        );


        let message =
            "利用者登録に失敗しました。";


        if (
            error &&
            error.message
        ) {

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
            !data.id ||
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
// ==================================================

async function syncWithSupabase() {

    if (!stampSupabaseClient) {

        console.error(
            "Supabaseクライアントがありません。"
        );

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
            "利用者データ解析エラー:",
            error
        );

        return;

    }


    if (
        !userData ||
        !userData.id ||
        !userData.name
    ) {

        return;

    }


    try {

        // ==================================================
        // participants確認・同期
        // ==================================================

        const {
            data:
                participantRows,
            error:
                participantError
        } =
            await stampSupabaseClient
                .from(
                    "participants"
                )
                .upsert(
                    {
                        participant_id:
                            userData.id,

                        name:
                            userData.name
                    },
                    {
                        onConflict:
                            "participant_id",

                        select:
                            "participant_id,name"
                    }
                );


        if (participantError) {

            throw participantError;

        }


        if (
            !participantRows ||
            participantRows.length === 0
        ) {

            throw new Error(
                "参加者情報の同期結果を確認できませんでした。"
            );

        }


        // ==================================================
        // 現在の参加記録取得
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
                    userData.id
                );


        if (participationError) {

            throw participationError;

        }


        const participations =
            participationRows || [];


        // ==================================================
        // 訓練マスター取得
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


        if (trainingError) {

            throw trainingError;

        }


        const trainings =
            trainingRows || [];


        // ==================================================
        // 参加記録をスタンプへ変換
        // ==================================================

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


        // ==================================================
        // 最大10個
        // ==================================================

        userData.stamps =
            stamps.slice(
                0,
                MAX_STAMP
            );


        // ==================================================
        // localStorage更新
        // ==================================================

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(userData)
        );


        // ==================================================
        // 画面更新
        // ==================================================

        displayCard(
            userData
        );


        console.log(
            "Supabase同期完了:",
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
// participationsに存在するtraining_idのみ表示。
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
        // 参加記録
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


        if (participationError) {

            throw participationError;

        }


        const participations =
            participationRows || [];


        if (
            participations.length === 0
        ) {

            container.innerHTML =
                "<p>参加した訓練はありません。</p>";

            return;

        }


        // ==================================================
        // 訓練情報
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


        if (trainingError) {

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


    const userName =
        document.getElementById(
            "user-name"
        );


    if (userName) {

        userName.textContent =
            data.name +
            " さん";

    }


    // ==================================================
    // QR
    // ==================================================

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


    // ==================================================
    // ID
    // ==================================================

    const userId =
        document.getElementById(
            "user-id"
        );


    if (userId) {

        userId.textContent =
            "ID : " +
            data.id;

    }


    // ==================================================
    // スタンプ
    // ==================================================

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
                i < data.stamps.length
                    ? "⭐"
                    : "☆";


            icons.appendChild(
                span
            );

        }

    }


    // ==================================================
    // スタンプ数
    // ==================================================

    const stampCount =
        document.getElementById(
            "stamp-count"
        );


    if (stampCount) {

        stampCount.textContent =
            data.stamps.length;

    }


    // ==================================================
    // 認定判定
    // ==================================================

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


    displayHistory(
        data
    );


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


            // ==================================================
            // 参加記録削除
            // ==================================================

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

                throw participationDeleteError;

            }


            // ==================================================
            // 参加者削除
            // ==================================================

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

    localStorage.removeItem(
        STORAGE_KEY
    );


    localStorage.removeItem(
        "iwaseLogin"
    );


    localStorage.removeItem(
        "role"
    );


    alert(
        "データとログイン情報を削除しました。\n\n" +
        "ログイン画面に戻ります。"
    );


    location.href =
        "../login/login.html";

}
