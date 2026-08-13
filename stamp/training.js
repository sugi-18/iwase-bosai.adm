// ==================================================
// 岩瀬自治会 防災アプリ
// 防災訓練 QR参加登録
//
// training.js 完成版
//
// stamp.js 完全連携版
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
// ・training_date対応
// ・旧date対応
// ・RLS環境対応
// ==================================================

"use strict";


// ==================================================
// Supabase設定
// ==================================================

const TRAINING_SUPABASE_URL =
    "https://zumbqukrojdpgfpfekjr.supabase.co";

const TRAINING_SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_8YXsMHOxLr7MOTEYShUM3w_LsZvR3Qn";

let trainingSupabaseClient = null;


// ==================================================
// localStorage
//
// stamp.js と完全に同じキーを使用
// ==================================================

const STORAGE_KEY =
    "iwaseStamp";


// ==================================================
// スタンプ設定
// ==================================================

const MAX_STAMP =
    10;


// ==================================================
// ページ初期化
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
// stamp.js と同じ方式
//
// 一般利用者向けページではAuthセッションを保持しない。
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
                TRAINING_SUPABASE_PUBLISHABLE_KEY,
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
    //
    // ?training_id=xxxx
    // ==================================================

    const trainingId =
        normalizeValue(
            params.get(
                "training_id"
            )
        );


    // ==================================================
    // 旧方式
    //
    // ?event=xxxx&date=xxxx
    // ==================================================

    const event =
        normalizeValue(
            params.get(
                "event"
            )
        );


    const date =
        normalizeValue(
            params.get(
                "date"
            )
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
    // 訓練が存在しない場合
    // ==================================================

    if (!training) {

        return;

    }


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


    const normalizedTrainingId =
        normalizeValue(
            trainingId
        );


    if (!normalizedTrainingId) {

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
            getErrorMessage(
                error
            )
        );


        disableRegisterButton(
            "参加登録できません"
        );


        return null;

    }

}


// ==================================================
// 旧event/dateから訓練取得
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


    const normalizedEvent =
        normalizeValue(
            event
        );


    const normalizedDate =
        normalizeValue(
            date
        );


    if (
        !normalizedEvent ||
        !normalizedDate
    ) {

        return null;

    }


    try {

        // ------------------------------------------
        // 現在のDB仕様
        // title + training_date
        // ------------------------------------------

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
                    normalizedEvent
                )
                .eq(
                    "training_date",
                    normalizedDate
                )
                .maybeSingle();


        if (error) {

            throw error;

        }


        if (data) {

            console.log(
                "旧方式訓練取得成功:",
                data
            );


            return data;

        }


        // ------------------------------------------
        // 念のため旧dateカラムにも対応
        // ------------------------------------------

        const {
            data:
                legacyData,
            error:
                legacyError
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
                    normalizedEvent
                )
                .eq(
                    "date",
                    normalizedDate
                )
                .maybeSingle();


        if (legacyError) {

            throw legacyError;

        }


        if (!legacyData) {

            console.error(
                "旧方式の訓練が見つかりません:",
                {
                    event:
                        normalizedEvent,

                    date:
                        normalizedDate
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
            "旧dateカラムの訓練取得成功:",
            legacyData
        );


        return legacyData;


    } catch (error) {

        console.error(
            "旧方式訓練検索エラー:",
            error
        );


        showResult(
            "訓練情報を取得できませんでした。\n\n" +
            getErrorMessage(
                error
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


    if (!training) {

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


        return;

    }


    const title =
        normalizeValue(
            training.title
        ) ||
        normalizeValue(
            fallbackEvent
        ) ||
        "防災訓練";


    const trainingDate =
        normalizeValue(
            training.training_date
        ) ||
        normalizeValue(
            training.date
        ) ||
        normalizeValue(
            fallbackDate
        ) ||
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
        normalizeValue(
            training.training_id
        ) ||
        normalizeValue(
            trainingId
        );


    if (!actualTrainingId) {

        showResult(
            "訓練IDを確認できませんでした。"
        );


        return;

    }


    // ==================================================
    // 利用者情報取得
    //
    // stamp.jsと同じlocalStorageを使用
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
    //
    // stamp.jsでは
    // data.id = participant_id
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
            "利用者情報を確認できませんでした。\n\n" +
            "スタンプカードを再登録してください。"
        );


        return;

    }


    const participantId =
        normalizeValue(
            participant.id
        );


    const participantName =
        normalizeValue(
            participant.name
        );


    if (
        !participantId ||
        !participantName
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
        // ① participants保存
        //
        // stamp.jsの登録仕様と統一
        //
        // INSERT後にSELECTしない。
        // ==================================================

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


            throw new Error(
                "参加者情報の保存に失敗しました。\n\n" +
                getErrorMessage(
                    participantError
                )
            );

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
        // ② Supabase上の参加済み確認
        //
        // 同じ人が同じ訓練を複数回登録しない。
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
                .limit(
                    1
                )
                .maybeSingle();


        if (checkError) {

            console.error(
                "参加確認エラー:",
                checkError
            );


            throw new Error(
                "参加履歴を確認できませんでした。\n\n" +
                getErrorMessage(
                    checkError
                )
            );

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


            // localStorageを最新状態にする
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
        // ③ participations登録
        //
        // INSERT後にSELECTしない。
        //
        // RLS環境でのINSERT後SELECTエラーを回避。
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


            throw new Error(
                "参加記録の保存に失敗しました。\n\n" +
                getErrorMessage(
                    participationError
                )
            );

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
        // ④ localStorageスタンプ更新
        // ==================================================

        updateLocalStamp(
            participant,
            training,
            actualTrainingId,
            fallbackEvent,
            fallbackDate
        );


        // ==================================================
        // ⑤ 完了
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


        showResult(
            "参加登録に失敗しました。\n\n" +
            getErrorMessage(
                error
            ) +
            "\n\n" +
            "通信状態を確認して、もう一度お試しください。"
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
// localStorageスタンプ更新
//
// stamp.jsと同じデータ構造
//
// {
//     id: participant_id,
//     name: "氏名",
//     stamps: [
//         {
//             training_id: "...",
//             date: "YYYY-MM-DD",
//             event: "防災訓練"
//         }
//     ]
// }
// ==================================================

function updateLocalStamp(
    participant,
    training,
    trainingId,
    fallbackEvent,
    fallbackDate
) {

    if (
        !participant
    ) {

        return;

    }


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
    // training_id
    // ==================================================

    const normalizedTrainingId =
        normalizeValue(
            trainingId
        );


    if (!normalizedTrainingId) {

        return;

    }


    // ==================================================
    // 訓練情報
    // ==================================================

    const trainingDate =
        normalizeValue(
            training.training_date
        ) ||
        normalizeValue(
            training.date
        ) ||
        normalizeValue(
            fallbackDate
        ) ||
        "";


    const trainingTitle =
        normalizeValue(
            training.title
        ) ||
        normalizeValue(
            fallbackEvent
        ) ||
        "防災訓練";


    // ==================================================
    // 既存スタンプ確認
    // ==================================================

    const alreadyLocal =
        participant.stamps.some(
            function (stamp) {

                if (!stamp) {

                    return false;

                }


                return (
                    normalizeValue(
                        stamp.training_id
                    ) ===
                    normalizedTrainingId
                );

            }
        );


    // ==================================================
    // 新規スタンプ
    // ==================================================

    if (!alreadyLocal) {

        // ------------------------------------------
        // 最大10個
        //
        // stamp.jsと統一
        // ------------------------------------------

        if (
            participant.stamps.length >=
            MAX_STAMP
        ) {

            participant.stamps.shift();

        }


        participant.stamps.push({

            training_id:
                normalizedTrainingId,

            date:
                trainingDate,

            event:
                trainingTitle

        });


        console.log(
            "新しいスタンプを追加:",
            {
                trainingId:
                    normalizedTrainingId,

                trainingDate,

                trainingTitle
            }
        );


    } else {

        console.log(
            "localStorageには既に登録済み:",
            normalizedTrainingId
        );

    }


    // ==================================================
    // 念のため10件に制限
    // ==================================================

    if (
        participant.stamps.length >
        MAX_STAMP
    ) {

        participant.stamps =
            participant.stamps.slice(
                -MAX_STAMP
            );

    }


    // ==================================================
    // localStorage保存
    // ==================================================

    try {

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


    } catch (error) {

        console.error(
            "localStorage保存エラー:",
            error
        );


        showResult(
            "参加登録は完了しましたが、\n" +
            "端末へのスタンプ保存に失敗しました。"
        );

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
        ).trim();


    // ==================================================
    // YYYY-MM-DD
    // ==================================================

    const parts =
        stringValue.split("-");


    if (
        parts.length ===
        3
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


        if (
            year &&
            month &&
            day
        ) {

            return (
                year +
                "年" +
                month +
                "月" +
                day +
                "日"
            );

        }

    }


    return stringValue;

}


// ==================================================
// 値の正規化
// ==================================================

function normalizeValue(
    value
) {

    if (
        value ===
        null ||
        value ===
        undefined
    ) {

        return "";

    }


    return String(
        value
    ).trim();

}


// ==================================================
// Supabaseエラーメッセージ
// ==================================================

function getErrorMessage(
    error
) {

    if (!error) {

        return "不明なエラー";

    }


    if (
        typeof error ===
        "string"
    ) {

        return error;

    }


    if (
        error.message
    ) {

        return error.message;

    }


    if (
        error.details
    ) {

        return error.details;

    }


    if (
        error.hint
    ) {

        return error.hint;

    }


    try {

        return JSON.stringify(
            error
        );

    } catch (
        stringifyError
    ) {

        return "不明なエラー";

    }

}


// ==================================================
// デバッグ用
// ==================================================

console.log(
    "training.js 読み込み完了"
);
