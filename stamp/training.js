// ==================================================
// 岩瀬自治会 防災アプリ
// 防災訓練 QR参加登録
//
// training.js 完成版
//
// 対応
// ・PC
// ・スマートフォン
// ・iPad
// ・Supabase
// ・training_id方式
// ・旧event + date方式
// ・participants保存
// ・participations保存
// ・二重参加登録防止
// ・localStorageスタンプ更新
// ==================================================

"use strict";


// ==================================================
// Supabase
// ==================================================

const TRAINING_SUPABASE_URL =
    "https://zumbqukrojdpgfpfekjr.supabase.co";

const TRAINING_SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_8YXsMHOxLr7MOTEYShUM3w_LsZvR3Qn";

let trainingSupabaseClient = null;


// ==================================================
// localStorage
// ==================================================

const STORAGE_KEY =
    "iwaseStamp";


// ==================================================
// 初期化
// ==================================================

window.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "training.js 初期化開始"
        );

        const initialized =
            initializeTrainingSupabase();

        if (!initialized) {

            showResult(
                "サーバーに接続できません。\n\n" +
                "通信状態を確認してください。"
            );

            disableRegisterButton(
                "接続できません"
            );

            return;

        }

        await initializeTrainingPage();

    }
);


// ==================================================
// Supabase初期化
//
// supabase.js に共通クライアントがある場合は
// それを使用。
// なければtraining.js内で生成。
// ==================================================

function initializeTrainingSupabase() {

    try {

        // ==================================================
        // 共通Supabaseクライアント
        // ==================================================

        if (
            typeof supabaseClient !==
            "undefined" &&
            supabaseClient
        ) {

            trainingSupabaseClient =
                supabaseClient;

            console.log(
                "Training Supabase client initialized using shared client."
            );

            return true;

        }


        // ==================================================
        // Supabaseライブラリ確認
        // ==================================================

        if (
            typeof window.supabase ===
            "undefined"
        ) {

            throw new Error(
                "Supabaseライブラリが読み込まれていません。"
            );

        }


        // ==================================================
        // training.js専用クライアント
        // ==================================================

        trainingSupabaseClient =
            window.supabase.createClient(
                TRAINING_SUPABASE_URL,
                TRAINING_SUPABASE_PUBLISHABLE_KEY
            );


        console.log(
            "Training Supabase client initialized."
        );


        return true;


    } catch (error) {

        console.error(
            "Supabase初期化エラー:",
            error
        );


        trainingSupabaseClient =
            null;


        return false;

    }

}


// ==================================================
// ページ初期化
// ==================================================

async function initializeTrainingPage() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    // ==================================================
    // 新方式
    // ==================================================

    const trainingId =
        params.get(
            "training_id"
        );


    // ==================================================
    // 旧方式
    // ==================================================

    const event =
        params.get(
            "event"
        );


    const date =
        params.get(
            "date"
        );


    console.log(
        "QRパラメータ:",
        {
            trainingId,
            event,
            date,
            url:
                window.location.href
        }
    );


    // ==================================================
    // 訓練情報取得
    // ==================================================

    let training = null;


    if (trainingId) {

        training =
            await getTrainingById(
                trainingId
            );

    } else if (
        event &&
        date
    ) {

        training =
            await getTrainingByEventAndDate(
                event,
                date
            );

    } else {

        console.error(
            "QRパラメータがありません。"
        );


        showResult(
            "訓練情報を確認できませんでした。\n\n" +
            "QRコードをもう一度読み込んでください。"
        );


        disableRegisterButton(
            "参加登録できません"
        );


        return;

    }


    // ==================================================
    // 訓練情報表示
    // ==================================================

    displayTraining(
        training,
        event,
        date
    );


    // ==================================================
    // 登録ボタン
    // ==================================================

    const addButton =
        document.getElementById(
            "add-training"
        );


    if (!addButton) {

        console.error(
            "#add-training が見つかりません。"
        );

        return;

    }


    // ==================================================
    // 二重イベント登録防止
    // ==================================================

    if (
        addButton.dataset.trainingListener ===
        "true"
    ) {

        return;

    }


    addButton.dataset.trainingListener =
        "true";


    // ==================================================
    // 参加登録
    // ==================================================

    addButton.addEventListener(
        "click",
        async function () {

            await registerParticipation(
                training,
                trainingId,
                event,
                date
            );

        }
    );

}


// ==================================================
// training_idから訓練取得
// ==================================================

async function getTrainingById(
    trainingId
) {

    if (
        !trainingSupabaseClient
    ) {

        return null;

    }


    try {

        const normalizedTrainingId =
            String(
                trainingId
            ).trim();


        if (!normalizedTrainingId) {

            return null;

        }


        const {
            data,
            error
        } =
            await trainingSupabaseClient
                .from(
                    "trainings"
                )
                .select(
                    "*"
                )
                .eq(
                    "training_id",
                    normalizedTrainingId
                )
                .maybeSingle();


        if (error) {

            throw error;

        }


        if (!data) {

            console.error(
                "指定された訓練が見つかりません:",
                normalizedTrainingId
            );


            showResult(
                "指定された訓練が見つかりません。"
            );


            disableRegisterButton(
                "参加登録できません"
            );


            return null;

        }


        console.log(
            "訓練取得成功:",
            data
        );


        return data;


    } catch (error) {

        console.error(
            "訓練取得エラー:",
            error
        );


        showResult(
            "訓練情報を取得できませんでした。\n\n" +
            (
                error.message ||
                "通信エラー"
            )
        );


        disableRegisterButton(
            "参加登録できません"
        );


        return null;

    }

}


// ==================================================
// event/dateから訓練取得
//
// 旧QRとの互換用
// ==================================================

async function getTrainingByEventAndDate(
    event,
    date
) {

    if (
        !trainingSupabaseClient
    ) {

        return null;

    }


    try {

        const {
            data,
            error
        } =
            await trainingSupabaseClient
                .from(
                    "trainings"
                )
                .select(
                    "*"
                )
                .eq(
                    "title",
                    event
                )
                .eq(
                    "training_date",
                    date
                )
                .maybeSingle();


        if (error) {

            throw error;

        }


        if (!data) {

            console.error(
                "旧方式の訓練が見つかりません:",
                {
                    event,
                    date
                }
            );


            showResult(
                "この訓練は管理者画面に登録されていません。"
            );


            disableRegisterButton(
                "参加登録できません"
            );


            return null;

        }


        console.log(
            "旧方式訓練取得成功:",
            data
        );


        return data;


    } catch (error) {

        console.error(
            "旧方式訓練検索エラー:",
            error
        );


        showResult(
            "訓練情報を取得できませんでした。\n\n" +
            (
                error.message ||
                "通信エラー"
            )
        );


        disableRegisterButton(
            "参加登録できません"
        );


        return null;

    }

}


// ==================================================
// 訓練情報表示
// ==================================================

function displayTraining(
    training,
    fallbackEvent,
    fallbackDate
) {

    const eventName =
        document.getElementById(
            "event-name"
        );


    const eventDate =
        document.getElementById(
            "event-date"
        );


    // ==================================================
    // 訓練あり
    // ==================================================

    if (training) {

        const title =
            training.title ||
            fallbackEvent ||
            "防災訓練";


        const trainingDate =
            training.training_date ||
            training.date ||
            fallbackDate ||
            "";


        if (eventName) {

            eventName.textContent =
                title;

        }


        if (eventDate) {

            eventDate.textContent =
                formatDate(
                    trainingDate
                );

        }


        console.log(
            "訓練表示:",
            {
                title,
                trainingDate
            }
        );


        return;

    }


    // ==================================================
    // 訓練なし
    // ==================================================

    if (eventName) {

        eventName.textContent =
            fallbackEvent ||
            "訓練情報が見つかりません";

    }


    if (eventDate) {

        eventDate.textContent =
            fallbackDate ||
            "";

    }


    disableRegisterButton(
        "参加登録できません"
    );


    showResult(
        "この訓練は管理者画面に登録されていません。"
    );

}


// ==================================================
// 参加登録
// ==================================================

async function registerParticipation(
    training,
    trainingId,
    fallbackEvent,
    fallbackDate
) {

    const addButton =
        document.getElementById(
            "add-training"
        );


    // ==================================================
    // 訓練確認
    // ==================================================

    if (!training) {

        showResult(
            "この訓練は管理者画面に登録されていません。"
        );


        return;

    }


    // ==================================================
    // training_id確定
    // ==================================================

    const actualTrainingId =
        String(
            training.training_id ||
            trainingId ||
            ""
        ).trim();


    if (!actualTrainingId) {

        showResult(
            "訓練IDを確認できませんでした。"
        );


        return;

    }


    // ==================================================
    // 利用者情報取得
    // ==================================================

    const saved =
        localStorage.getItem(
            STORAGE_KEY
        );


    if (!saved) {

        alert(
            "先にスタンプカード登録をしてください。"
        );


        return;

    }


    let participant;


    try {

        participant =
            JSON.parse(
                saved
            );

    } catch (error) {

        console.error(
            "利用者情報解析エラー:",
            error
        );


        alert(
            "利用者情報を読み込めませんでした。"
        );


        return;

    }


    // ==================================================
    // 利用者情報確認
    // ==================================================

    if (
        !participant ||
        !participant.id ||
        !participant.name
    ) {

        console.error(
            "利用者情報不正:",
            participant
        );


        alert(
            "利用者情報を確認できませんでした。"
        );


        return;

    }


    // ==================================================
    // Supabase確認
    // ==================================================

    if (
        !trainingSupabaseClient
    ) {

        alert(
            "Supabaseに接続できません。\n\n" +
            "通信状態を確認してください。"
        );


        return;

    }


    // ==================================================
    // ボタン無効化
    // ==================================================

    if (addButton) {

        addButton.disabled =
            true;

        addButton.textContent =
            "登録中……";

    }


    try {

        // ==================================================
        // ① participantsへ保存
        //
        // select()を付けない。
        //
        // RLS環境でINSERT後のSELECTが失敗する
        // 問題を避ける。
        // ==================================================

        const participantId =
            String(
                participant.id
            ).trim();


        const participantName =
            String(
                participant.name
            ).trim();


        const {
            error:
                participantError
        } =
            await trainingSupabaseClient
                .from(
                    "participants"
                )
                .upsert(
                    {
                        participant_id:
                            participantId,

                        name:
                            participantName
                    },
                    {
                        onConflict:
                            "participant_id"
                    }
                );


        if (participantError) {

            console.error(
                "participants保存エラー:",
                participantError
            );


            throw participantError;

        }


        console.log(
            "participants保存完了:",
            {
                participantId,
                name:
                    participantName
            }
        );


        // ==================================================
        // ② 参加済み確認
        // ==================================================

        const {
            data:
                existingParticipation,
            error:
                checkError
        } =
            await trainingSupabaseClient
                .from(
                    "participations"
                )
                .select(
                    "id"
                )
                .eq(
                    "participant_id",
                    participantId
                )
                .eq(
                    "training_id",
                    actualTrainingId
                )
                .maybeSingle();


        if (checkError) {

            console.error(
                "参加確認エラー:",
                checkError
            );


            throw checkError;

        }


        // ==================================================
        // すでに参加済み
        // ==================================================

        if (
            existingParticipation
        ) {

            console.log(
                "すでに参加登録済み:",
                {
                    participantId,
                    trainingId:
                        actualTrainingId
                }
            );


            // ------------------------------------------------
            // localStorageを最新化
            // ------------------------------------------------

            updateLocalStamp(
                participant,
                training,
                actualTrainingId,
                fallbackEvent,
                fallbackDate
            );


            showResult(
                "この訓練はすでに参加登録されています。"
            );


            if (addButton) {

                addButton.textContent =
                    "登録済み";

            }


            return;

        }


        // ==================================================
        // ③ participationsへ登録
        //
        // select()を付けない。
        // ==================================================

        const {
            error:
                participationError
        } =
            await trainingSupabaseClient
                .from(
                    "participations"
                )
                .insert(
                    {
                        participant_id:
                            participantId,

                        training_id:
                            actualTrainingId
                    }
                );


        if (participationError) {

            console.error(
                "participations保存エラー:",
                participationError
            );


            throw participationError;

        }


        console.log(
            "participations保存完了:",
            {
                participantId,
                trainingId:
                    actualTrainingId
            }
        );


        // ==================================================
        // ④ localStorage更新
        // ==================================================

        updateLocalStamp(
            participant,
            training,
            actualTrainingId,
            fallbackEvent,
            fallbackDate
        );


        // ==================================================
        // 完了
        // ==================================================

        showResult(
            "✅ 参加登録が完了しました！"
        );


        if (addButton) {

            addButton.textContent =
                "登録済み";

        }


        console.log(
            "参加登録完了:",
            {
                participantId,
                trainingId:
                    actualTrainingId
            }
        );


    } catch (error) {

        console.error(
            "参加登録エラー:",
            error
        );


        let message =
            "参加登録に失敗しました。";


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


        showResult(
            message
        );


        if (addButton) {

            addButton.disabled =
                false;

            addButton.textContent =
                "参加登録する";

        }

    }

}


// ==================================================
// localStorageのスタンプ更新
// ==================================================

function updateLocalStamp(
    participant,
    training,
    trainingId,
    fallbackEvent,
    fallbackDate
) {

    // ==================================================
    // stamps配列確認
    // ==================================================

    if (
        !Array.isArray(
            participant.stamps
        )
    ) {

        participant.stamps =
            [];

    }


    // ==================================================
    // 訓練情報
    // ==================================================

    const trainingDate =
        training.training_date ||
        training.date ||
        fallbackDate ||
        "";


    const trainingTitle =
        training.title ||
        fallbackEvent ||
        "防災訓練";


    // ==================================================
    // 既存スタンプ確認
    // ==================================================

    const alreadyLocal =
        participant.stamps.some(
            function (stamp) {

                return (
                    String(
                        stamp.training_id
                    ) ===
                    String(
                        trainingId
                    )
                );

            }
        );


    // ==================================================
    // 新規スタンプ
    // ==================================================

    if (!alreadyLocal) {

        // --------------------------------------------------
        // 最大10個
        // --------------------------------------------------

        if (
            participant.stamps.length >=
            10
        ) {

            participant.stamps.shift();

        }


        participant.stamps.push({

            training_id:
                trainingId,

            date:
                trainingDate,

            event:
                trainingTitle

        });


        console.log(
            "新しいスタンプを追加:",
            {
                trainingId,
                trainingDate,
                trainingTitle
            }
        );

    } else {

        console.log(
            "localStorageには既に登録済み:",
            trainingId
        );

    }


    // ==================================================
    // localStorage保存
    // ==================================================

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
            participant
        )
    );


    console.log(
        "localStorage参加履歴更新:",
        participant
    );

}


// ==================================================
// 結果表示
// ==================================================

function showResult(
    message
) {

    const result =
        document.getElementById(
            "result"
        );


    if (result) {

        result.textContent =
            message;

    }


    console.log(
        "training.js:",
        message
    );

}


// ==================================================
// 登録ボタン無効化
// ==================================================

function disableRegisterButton(
    text
) {

    const addButton =
        document.getElementById(
            "add-training"
        );


    if (!addButton) {

        return;

    }


    addButton.disabled =
        true;


    addButton.textContent =
        text;

}


// ==================================================
// 日付表示
// ==================================================

function formatDate(
    value
) {

    if (!value) {

        return "";

    }


    const stringValue =
        String(
            value
        );


    // ==================================================
    // YYYY-MM-DD
    // ==================================================

    const parts =
        stringValue.split("-");


    if (
        parts.length === 3
    ) {

        const year =
            parts[0];


        const month =
            Number(
                parts[1]
            );


        const day =
            Number(
                parts[2]
            );


        return (
            year +
            "年" +
            month +
            "月" +
            day +
            "日"
        );

    }


    return stringValue;

}


// ==================================================
// デバッグ用
// ==================================================

console.log(
    "training.js 読み込み完了"
);
