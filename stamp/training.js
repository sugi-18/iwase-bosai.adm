// ==================================================
// 岩瀬自治会 防災アプリ
// 防災訓練 QR参加登録
//
// iPad対応・登録確認強化版
// ==================================================

"use strict";


// ==================================================
// Supabase
// ==================================================

const TRAINING_SUPABASE_URL =
    "https://zumbqukrojdpgfpfekjr.supabase.co";

const TRAINING_SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_8YXsMHOxLr7MOTEYShUM3w_LsZvR3Qn";


let trainingSupabaseClient =
    null;


const STORAGE_KEY =
    "iwaseStamp";


// ==================================================
// 初期化
// ==================================================

window.addEventListener(
    "DOMContentLoaded",
    async function () {

        initializeTrainingSupabase();

        await initializeTrainingPage();

    }
);


// ==================================================
// Supabase初期化
// ==================================================

function initializeTrainingSupabase() {

    try {

        if (
            typeof window.supabase ===
            "undefined"
        ) {

            throw new Error(
                "Supabaseライブラリが読み込まれていません。"
            );

        }


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
            location.search
        );


    // ==================================================
    // training_id
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


    // ==================================================
    // パラメータ確認
    // ==================================================

    console.log(
        "QRパラメータ:",
        {
            trainingId,
            event,
            date,
            url:
                location.href
        }
    );


    if (!trainingSupabaseClient) {

        showResult(
            "サーバーに接続できません。\n通信状態を確認してください。"
        );


        disableRegisterButton(
            "接続できません"
        );


        return;

    }


    // ==================================================
    // 訓練取得
    // ==================================================

    let training =
        null;


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

    }


    // ==================================================
    // 訓練表示
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

        return;

    }


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

        const {
            data,
            error
        } =
            await trainingSupabaseClient
                .from(
                    "trainings"
                )
                .select("*")
                .eq(
                    "training_id",
                    String(
                        trainingId
                    ).trim()
                )
                .maybeSingle();


        if (error) {

            throw error;

        }


        if (!data) {

            console.error(
                "指定された訓練が見つかりません:",
                trainingId
            );

            return null;

        }


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
                .select("*")
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


        return data || null;


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


    if (training) {

        if (eventName) {

            eventName.textContent =
                training.title ||
                "防災訓練";

        }


        if (eventDate) {

            eventDate.textContent =
                formatDate(
                    training.training_date ||
                    training.date
                );

        }


        return;

    }


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

    const result =
        document.getElementById(
            "result"
        );


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
    // 利用者情報
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


    if (
        !participant ||
        !participant.id ||
        !participant.name
    ) {

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


    if (addButton) {

        addButton.disabled =
            true;

        addButton.textContent =
            "登録中……";

    }


    try {

        // ==================================================
        // ① participants確認
        // ==================================================

        const {
            data:
                participantRows,
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
                            participant.id,

                        name:
                            participant.name
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
                "参加者情報の保存結果を確認できませんでした。"
            );

        }


        // ==================================================
        // ② 既存参加確認
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
                    participant.id
                )
                .eq(
                    "training_id",
                    actualTrainingId
                )
                .maybeSingle();


        if (checkError) {

            throw checkError;

        }


        // ==================================================
        // すでに参加済み
        // ==================================================

        if (
            existingParticipation
        ) {

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
        // ③ participations INSERT
        // ==================================================

        const {
            data:
                participationRows,
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
                            participant.id,

                        training_id:
                            actualTrainingId
                    }
                )
                .select(
                    "id,participant_id,training_id"
                );


        if (participationError) {

            throw participationError;

        }


        // ==================================================
        // INSERT結果確認
        // ==================================================

        if (
            !participationRows ||
            participationRows.length === 0
        ) {

            throw new Error(
                "参加登録の保存結果を確認できませんでした。"
            );

        }


        // ==================================================
        // ④ localStorage更新
        // ==================================================

        if (
            !Array.isArray(
                participant.stamps
            )
        ) {

            participant.stamps =
                [];

        }


        const trainingDate =
            training.training_date ||
            training.date ||
            fallbackDate ||
            "";


        const trainingTitle =
            training.title ||
            fallbackEvent ||
            "防災訓練";


        const alreadyLocal =
            participant.stamps.some(
                stamp =>
                    String(
                        stamp.training_id
                    ) ===
                    String(
                        actualTrainingId
                    )
            );


        if (!alreadyLocal) {

            if (
                participant.stamps.length >=
                10
            ) {

                participant.stamps.shift();

            }


            participant.stamps.push({

                training_id:
                    actualTrainingId,

                date:
                    trainingDate,

                event:
                    trainingTitle

            });

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


        // ==================================================
        // 保存確認
        // ==================================================

        const verifySaved =
            localStorage.getItem(
                STORAGE_KEY
            );


        if (!verifySaved) {

            throw new Error(
                "端末への参加履歴保存を確認できませんでした。"
            );

        }


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
                participantId:
                    participant.id,

                trainingId:
                    actualTrainingId,

                participation:
                    participationRows[0]
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


    const parts =
        String(value).split("-");


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


    return String(value);

}
