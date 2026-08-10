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
    // localStorage側の重複確認
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
    // localStorageへ保存
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
    // Supabaseへ保存
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
    // ① participants
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


    // -----------------------------
    // 参加者が既に存在する場合
    // -----------------------------

    if (participantError) {

        if (
            participantError.code ===
            "23505"
        ) {

            console.log(
                "参加者は既にSupabaseに登録されています。"
            );

        }

        else {

            console.error(
                "participants INSERT ERROR:",
                participantError
            );

            throw participantError;

        }

    }

    else {

        console.log(
            "participants 登録成功"
        );

    }


    // =============================
    // ② trainings
    // =============================

    const {

        error:
            trainingError

    } = await supabaseClient

        .from("trainings")

        .insert({

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

        });


    // -----------------------------
    // 訓練が既に存在する場合
    // -----------------------------

    if (trainingError) {

        if (
            trainingError.code ===
            "23505"
        ) {

            console.log(
                "訓練は既にSupabaseに登録されています。"
            );

        }

        else {

            console.error(
                "trainings INSERT ERROR:",
                trainingError
            );

            throw trainingError;

        }

    }

    else {

        console.log(
            "trainings 登録成功"
        );

    }


    // =============================
    // ③ participations
    // =============================
    //
    // まず同じ参加記録があるか確認
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
    // 既に参加記録がある場合
    // =============================

    if (
        existingParticipation
    ) {

        console.log(
            "参加記録は既にSupabaseに登録されています。"
        );

        return;

    }


    // =============================
    // 参加記録を登録
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
    // 完了
    // =============================

    console.log(

        "============================="

    );

    console.log(

        "Supabaseへの参加記録保存完了"

    );

    console.log({

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

    });

    console.log(

        "============================="

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
