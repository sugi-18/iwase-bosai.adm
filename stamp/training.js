// =============================
// 防災訓練QR参加登録
// Supabase連携版
// =============================


const STORAGE_KEY = "iwaseStamp";


// =============================
// ページ読み込み
// =============================

window.onload = function () {


    // -----------------------------
    // QRから情報取得
    // -----------------------------

    const params =
        new URLSearchParams(
            location.search
        );


    const event =
        params.get("event");


    const date =
        params.get("date");


    // -----------------------------
    // 訓練名表示
    // -----------------------------

    const eventName =
        document.getElementById(
            "event-name"
        );


    if (eventName) {

        eventName.textContent =
            event || "防災訓練";

    }


    // -----------------------------
    // 訓練日表示
    // -----------------------------

    const eventDate =
        document.getElementById(
            "event-date"
        );


    if (eventDate) {

        eventDate.textContent =
            date || "";

    }


    // -----------------------------
    // 参加登録ボタン
    // -----------------------------

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


    // =============================
    // localStorageから利用者情報取得
    // =============================

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


    // =============================
    // 利用者情報確認
    // =============================

    if (
        !data.id
        ||
        !data.name
    ) {

        console.error(
            "利用者IDまたは氏名がありません:",
            data
        );

        alert(
            "利用者情報を確認できませんでした"
        );

        return;

    }


    // =============================
    // stamps配列確認
    // =============================

    if (
        !Array.isArray(
            data.stamps
        )
    ) {

        data.stamps = [];

    }


    // =============================
    // 重複防止
    // =============================

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
    // ① localStorageへ保存
    // =============================

    data.stamps.push({

        date:
            date,

        event:
            event

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

        console.error(
            "Supabase保存エラー:",
            error
        );

        /*
         * Supabase保存に失敗しても、
         * 現在のスタンプカードは
         * そのまま利用できるようにする。
         */

    }


    // =============================
    // 完了表示
    // =============================

    const result =
        document.getElementById(
            "result"
        );


    if (result) {

        result.textContent =
            "✅ スタンプを追加しました！";

    }

}


// =============================
// Supabase保存
// =============================

async function saveParticipationToSupabase(

    data,

    date,

    event

) {


    // =============================
    // Supabaseクライアント確認
    // =============================

    if (
        typeof supabaseClient ===
        "undefined"
    ) {

        throw new Error(
            "supabaseClient が読み込まれていません。"
        );

    }


    // =============================
    // 利用者情報確認
    // =============================

    if (
        !data.id
        ||
        !data.name
    ) {

        throw new Error(
            "利用者IDまたは氏名がありません。"
        );

    }


    // =============================
    // 訓練ID作成
    // =============================

    const trainingId =
        createTrainingId(

            date,

            event

        );


    if (!trainingId) {

        throw new Error(
            "訓練IDを作成できませんでした。"
        );

    }


    // =============================
    // ① 参加者をSupabaseへ登録
    // =============================
    //
    // 今回は原因切り分けのため、
    // upsertではなくinsertを使用。
    // =============================

    const {

        error:
            participantError

    } = await supabaseClient

        .from("participants")

        .insert({

            participant_id:
                data.id,

            name:
                data.name

        });


    if (participantError) {

        console.error(
            "participants INSERT ERROR:",
            participantError
        );

        /*
         * すでに参加者が存在する場合は、
         * 参加者登録をスキップして
         * 次の処理へ進む。
         */

        if (
            participantError.code !==
            "23505"
        ) {

            throw participantError;

        }

    }


    // =============================
    // ② 訓練情報をSupabaseへ登録
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
                    event ||
                    "防災訓練",

                date:
                    date ||
                    null,

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

        console.error(
            "trainings UPSERT ERROR:",
            trainingError
        );

        throw trainingError;

    }


    // =============================
    // ③ 参加記録の重複確認
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

        console.error(
            "participations CHECK ERROR:",
            checkError
        );

        throw checkError;

    }


    // =============================
    // すでに参加記録がある場合
    // =============================

    if (
        existingParticipation
    ) {

        console.log(
            "Supabaseにはすでに参加記録があります。"
        );

        return;

    }


    // =============================
    // ④ 参加記録を登録
    // =============================

    const {

        error:
            participationError

    } = await supabaseClient

        .from("participations")

        .insert({

            participant_id:
                data.id,

            training_id:
                trainingId

        });


    if (participationError) {

        console.error(
            "participations INSERT ERROR:",
            participationError
        );

        throw participationError;

    }


    // =============================
    // 完了ログ
    // =============================

    console.log(

        "Supabaseへの参加記録保存完了:",

        {

            participant_id:
                data.id,

            participant_name:
                data.name,

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
