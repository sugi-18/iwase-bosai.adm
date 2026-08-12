// ==================================================
// 岩瀬自治会 防災アプリ
// 防災訓練 QR参加登録
// 管理者登録訓練のみ参加可能
// ==================================================

"use strict";

const STORAGE_KEY = "iwaseStamp";


window.addEventListener(
    "DOMContentLoaded",
    async function () {

        await initializeTrainingPage();

    }
);


// ==================================================
// 初期化
// ==================================================

async function initializeTrainingPage() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const trainingId =
        params.get("training_id");


    const event =
        params.get("event");


    const date =
        params.get("date");


    const eventName =
        document.getElementById(
            "event-name"
        );


    const eventDate =
        document.getElementById(
            "event-date"
        );


    const result =
        document.getElementById(
            "result"
        );


    // --------------------------------------------------
    // QRにtraining_idがない旧形式への対応
    // --------------------------------------------------

    if (!trainingId) {

        if (eventName) {

            eventName.textContent =
                event || "防災訓練";

        }


        if (eventDate) {

            eventDate.textContent =
                date || "";

        }


        if (result) {

            result.textContent =
                "このQRコードは現在の方式に対応していません。";

        }


        const button =
            document.getElementById(
                "add-training"
            );


        if (button) {

            button.disabled =
                true;

        }


        return;

    }


    // --------------------------------------------------
    // Supabase確認
    // --------------------------------------------------

    if (
        typeof supabaseClient ===
        "undefined"
    ) {

        console.error(
            "supabaseClient がありません。"
        );

        if (result) {

            result.textContent =
                "システムに接続できませんでした。";

        }

        return;

    }


    // --------------------------------------------------
    // 管理者が登録した訓練を取得
    // --------------------------------------------------

    const {
        data: training,
        error
    } =
        await supabaseClient
            .from("trainings")
            .select(
                "training_id, title, training_date"
            )
            .eq(
                "training_id",
                trainingId
            )
            .maybeSingle();


    if (error) {

        console.error(
            "訓練情報取得エラー:",
            error
        );


        if (result) {

            result.textContent =
                "訓練情報を取得できませんでした。";

        }

        return;

    }


    // --------------------------------------------------
    // 管理者登録訓練が存在しない
    // --------------------------------------------------

    if (!training) {

        if (eventName) {

            eventName.textContent =
                "登録されていない訓練です";

        }


        if (eventDate) {

            eventDate.textContent =
                "";

        }


        if (result) {

            result.textContent =
                "この訓練は現在登録されていません。";

        }


        const button =
            document.getElementById(
                "add-training"
            );


        if (button) {

            button.disabled =
                true;

        }


        return;

    }


    // --------------------------------------------------
    // 最新の訓練情報を表示
    // --------------------------------------------------

    if (eventName) {

        eventName.textContent =
            training.title ||
            "防災訓練";

    }


    if (eventDate) {

        eventDate.textContent =
            formatTrainingDate(
                training.training_date
            );

    }


    // --------------------------------------------------
    // 参加登録ボタン
    // --------------------------------------------------

    const addButton =
        document.getElementById(
            "add-training"
        );


    if (addButton) {

        addButton.disabled =
            false;


        addButton.addEventListener(
            "click",
            async function () {

                await addTraining(
                    training
                );

            }
        );

    }

}


// ==================================================
// 参加登録
// ==================================================

async function addTraining(
    training
) {

    const result =
        document.getElementById(
            "result"
        );


    // --------------------------------------------------
    // 利用者情報
    // --------------------------------------------------

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


    let data;


    try {

        data =
            JSON.parse(
                saved
            );

    }

    catch (error) {

        console.error(
            error
        );

        alert(
            "利用者情報を読み込めませんでした。"
        );

        return;

    }


    if (
        !data.id ||
        !data.name
    ) {

        alert(
            "利用者情報を確認できませんでした。"
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


    // --------------------------------------------------
    // ローカル側の重複確認
    // --------------------------------------------------

    const localExists =
        data.stamps.some(
            stamp =>
                stamp.training_id ===
                training.training_id
        );


    if (localExists) {

        if (result) {

            result.textContent =
                "この訓練はすでに登録されています。";

        }

        return;

    }


    // --------------------------------------------------
    // Supabase参加者登録
    // --------------------------------------------------

    const {
        error: participantError
    } =
        await supabaseClient
            .from("participants")
            .upsert(
                {
                    participant_id:
                        data.id,

                    name:
                        data.name

                },
                {
                    onConflict:
                        "participant_id"
                }
            );


    if (participantError) {

        console.error(
            "participants ERROR:",
            participantError
        );

        alert(
            "参加者情報の保存に失敗しました。"
        );

        return;

    }


    // --------------------------------------------------
    // Supabase参加履歴確認
    // --------------------------------------------------

    const {
        data: existingParticipation,
        error: checkError
    } =
        await supabaseClient
            .from("participations")
            .select("id")
            .eq(
                "participant_id",
                data.id
            )
            .eq(
                "training_id",
                training.training_id
            )
            .maybeSingle();


    if (checkError) {

        console.error(
            "参加履歴確認エラー:",
            checkError
        );

        alert(
            "参加履歴を確認できませんでした。"
        );

        return;

    }


    // --------------------------------------------------
    // 既に登録済み
    // --------------------------------------------------

    if (existingParticipation) {

        if (result) {

            result.textContent =
                "この訓練はすでに登録されています。";

        }


        // ローカルにも反映
        syncLocalStamp(
            data,
            training
        );


        return;

    }


    // --------------------------------------------------
    // 参加履歴登録
    // --------------------------------------------------

    const {
        error: participationError
    } =
        await supabaseClient
            .from("participations")
            .insert(
                {
                    participant_id:
                        data.id,

                    training_id:
                        training.training_id
                }
            );


    if (participationError) {

        console.error(
            "participations INSERT ERROR:",
            participationError
        );

        alert(
            "参加記録の保存に失敗しました。\n" +
            participationError.message
        );

        return;

    }


    // --------------------------------------------------
    // ローカルスタンプ更新
    // --------------------------------------------------

    syncLocalStamp(
        data,
        training
    );


    // --------------------------------------------------
    // 完了
    // --------------------------------------------------

    if (result) {

        result.textContent =
            "✅ 参加登録しました！";

    }


    const button =
        document.getElementById(
            "add-training"
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "登録済み";

    }

}


// ==================================================
// ローカルスタンプ同期
// ==================================================

function syncLocalStamp(
    data,
    training
) {

    if (
        !Array.isArray(
            data.stamps
        )
    ) {

        data.stamps = [];

    }


    const exists =
        data.stamps.some(
            stamp =>
                stamp.training_id ===
                training.training_id
        );


    if (exists) {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data)
        );

        return;

    }


    if (
        data.stamps.length >= 10
    ) {

        return;

    }


    data.stamps.push({

        training_id:
            training.training_id,

        date:
            training.training_date ||
            "",

        event:
            training.title ||
            ""

    });


    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );

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


    const parts =
        String(date).split("-");


    if (
        parts.length !== 3
    ) {

        return date;

    }


    return (
        parts[0] +
        "年" +
        Number(parts[1]) +
        "月" +
        Number(parts[2]) +
        "日"
    );

}
