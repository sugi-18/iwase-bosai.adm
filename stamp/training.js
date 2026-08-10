// =============================
// 防災訓練QR参加登録
// Supabase連携版
// =============================


const STORAGE_KEY = "iwaseStamp";


// =============================
// ページ読み込み
// =============================

window.onload = function () {


    // QRから情報取得

    const params =
        new URLSearchParams(
            location.search
        );


    const event =
        params.get("event");


    const date =
        params.get("date");


    // 訓練名表示

    const eventName =
        document.getElementById(
            "event-name"
        );


    if (eventName) {

        eventName.textContent =
            event || "防災訓練";

    }


    // 訓練日表示

    const eventDate =
        document.getElementById(
            "event-date"
        );


    if (eventDate) {

        eventDate.textContent =
            date || "";

    }


    // 参加登録ボタン

    const addButton =
        document.getElementById(
            "add-training"
        );


    if (addButton) {

        addButton.addEventListener(
            "click",
            function () {

                addTraining(
                    date,
                    event
                );

            }
        );

    }

};


// =============================
// 訓練参加登録
// =============================

async function addTraining(
    date,
    event
) {


    // -----------------------------
    // localStorageから利用者情報取得
    // -----------------------------

    const saved =
        localStorage.getItem(
            STORAGE_KEY
        );


    if (!saved) {

        alert(
            "先にスタンプカード登録をしてください"
        );

        return;

    }


    let data;


    try {

        data =
            JSON.parse(saved);

    }

    catch (error) {

        console.error(
            "利用者データの読み込みエラー:",
            error
        );

        alert(
            "利用者データを読み込めませんでした"
        );

        return;

    }


    // -----------------------------
    // スタンプデータ確認
    // -----------------------------

    if (
        !Array.isArray(
            data.stamps
        )
    ) {

        data.stamps = [];

    }


    // -----------------------------
    // 重複防止
    // -----------------------------

    const exists =
        data.stamps.some(

            stamp =>

                stamp.date === date

                &&

                stamp.event === event

        );


    if (exists) {

        document
            .getElementById(
                "result"
            )
            .textContent =
            "この訓練は登録済みです";

        return;

    }


    // =============================
    // ① 現在のスタンプカードへ保存
    // =============================

    data.stamps.push({

        date: date,

        event: event

    });


    try {

        localStorage.setItem(

            STORAGE_KEY,

            JSON.stringify(data)

        );

    }

    catch (error) {

        console.error(
            "localStorage保存エラー:",
            error
        );

        alert(
            "参加記録を保存できませんでした"
        );

        return;

    }


    // =============================
    // ② Supabaseへ保存
    // =============================

    try {

        await saveParticipationToSupabase(
            data,
            date,
            event
        );

    }

    catch (error) {

        /*
         * Supabaseへの保存に失敗しても、
         * 現在のスタンプカード機能は
         * そのまま利用できるようにする。
         */

        console.error(
            "Supabase保存エラー:",
            error
        );

    }


    // =============================
    // 完了表示
    // =============================

    document
        .getElementById(
            "result"
        )
        .textContent =
        "✅ スタンプを追加しました！";

}


// =============================
// Supabase保存
// =============================

async function saveParticipationToSupabase(
    data,
    date,
    event
) {


    // -----------------------------
    // Supabase接続確認
    // -----------------------------

    if (
        typeof supabaseClient ===
        "undefined"
    ) {

        console.warn(
            "Supabaseクライアントが読み込まれていません。"
        );

        return;

    }


    // -----------------------------
    // 利用者情報確認
    // -----------------------------

    if (
        !data.id
        ||
        !data.name
    ) {

        console.warn(
            "利用者IDまたは氏名がありません。"
        );

        return;

    }


    // -----------------------------
    // 訓練ID作成
    // -----------------------------
    //
    // 現在のQRコードは
    // event と date を持っているため、
    // それを組み合わせて訓練IDとする。
    //
    // 例：
    // T-2026-09-20-秋季防災訓練
    //
    // 将来的に管理者画面を作る際は、
    // このtraining_idをそのまま利用できる。
    // -----------------------------

    const trainingId =
        createTrainingId(
            date,
            event
        );


    if (!trainingId) {

        console.warn(
            "訓練IDを作成できませんでした。"
        );

        return;

    }


    // =============================
    // 参加者情報を保存
    // =============================

    const {
        error:
            participantError
    } = await supabaseClient

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

        throw participantError;

    }


    // =============================
    // 訓練情報を保存
    // =============================

    const {
        error:
            trainingError
    } = await supabaseClient

        .from("trainings")

        .upsert(

            {

                training_id:
                    trainingId,

                title:
                    event || "防災訓練",

                date:
                    date || null,

                location:
                    null,

                description:
                    null

            },

            {

                onConflict:
                    "training_id"

            }

        );


    if (trainingError) {

        throw trainingError;

    }


    // =============================
    // すでに参加記録があるか確認
    // =============================

    const {

        data:
            existingParticipation,

        error:
            checkError

    } = await supabaseClient

        .from("participations")

        .select("id")

        .eq(
            "participant_id",
            data.id
        )

        .eq(
            "training_id",
            trainingId
        )

        .maybeSingle();


    if (checkError) {

        throw checkError;

    }


    // -----------------------------
    // すでに登録済みなら終了
    // -----------------------------

    if (
        existingParticipation
    ) {

        console.log(
            "Supabaseにはすでに参加記録があります。"
        );

        return;

    }


    // =============================
    // 参加記録を保存
    // =============================

    const {

        error:
            participationError

    } = await supabaseClient

        .from("participations")

        .insert(

            {

                participant_id:
                    data.id,

                training_id:
                    trainingId

            }

        );


    if (participationError) {

        throw participationError;

    }


    console.log(
        "Supabaseへの参加記録保存完了:",
        {
            participant_id:
                data.id,

            training_id:
                trainingId,

            date:
                date,

            event:
                event
        }
    );

}


// =============================
// 訓練ID作成
// =============================

function createTrainingId(
    date,
    event
) {


    if (
        !date
        ||
        !event
    ) {

        return null;

    }


    return (

        "T-"

        +

        String(date)

        +

        "-"

        +

        String(event)

            .trim()

            .replace(
                /\s+/g,
                "-"
            )

    );

}
