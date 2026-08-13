/* ==================================================
   岩瀬自治会 防災アプリ
   参加者カルテ
   Step 1 強化版

   ・累計参加回数
   ・2026年度参加回数
   ・初参加 / リピーター / 未参加
   ・初回参加日
   ・最終参加日
   ・訓練実施日（trainig_date）
   ・訓練場所
   ・参加履歴
   ・防災マイスター進捗
   ================================================== */

(function () {

    "use strict";


    /* ==================================================
       設定
    ================================================== */

    const CURRENT_FISCAL_YEAR = 2026;

    const CERTIFICATION_TARGET = 5;


    /* ==================================================
       初期化
    ================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            createParticipantCardModal();

            setupParticipantCardEvents();

            setupParticipantCardButtonObserver();

        }
    );


    /* ==================================================
       モーダル作成
    ================================================== */

    function createParticipantCardModal() {

        if (
            document.getElementById(
                "participantCardModal"
            )
        ) {
            return;
        }


        const modal =
            document.createElement("div");


        modal.id =
            "participantCardModal";

        modal.className =
            "modal hidden";


        modal.innerHTML = `

            <div
                class="
                    modal-content
                    large-modal
                    participant-card-modal
                "
            >

                <div
                    class="
                        participant-card-modal-header
                    "
                >

                    <h2 id="participantCardTitle">
                        参加者カルテ
                    </h2>


                    <button
                        type="button"
                        id="closeParticipantCardButton"
                        class="participant-card-close"
                        aria-label="閉じる"
                    >
                        ×
                    </button>

                </div>


                <div
                    id="participantCardContent"
                    class="participant-card-content"
                >
                    読み込み中...
                </div>


                <div class="modal-buttons">

                    <button
                        type="button"
                        id="participantCardCloseButton"
                        class="secondary-button"
                    >
                        閉じる
                    </button>

                </div>

            </div>

        `;


        document.body.appendChild(
            modal
        );

    }


    /* ==================================================
       イベント設定
    ================================================== */

    function setupParticipantCardEvents() {

        document.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        '[data-action="participant-card"]'
                    );


                if (!button) {
                    return;
                }


                event.preventDefault();


                const id =
                    button.dataset.id;


                if (!id) {
                    return;
                }


                openParticipantCard(id);

            }
        );


        document
            .getElementById(
                "closeParticipantCardButton"
            )
            ?.addEventListener(
                "click",
                closeParticipantCard
            );


        document
            .getElementById(
                "participantCardCloseButton"
            )
            ?.addEventListener(
                "click",
                closeParticipantCard
            );


        document.addEventListener(
            "click",
            event => {

                const modal =
                    document.getElementById(
                        "participantCardModal"
                    );


                if (
                    event.target === modal
                ) {

                    closeParticipantCard();

                }

            }
        );

    }


    /* ==================================================
       既存参加者一覧のボタンをカルテに変更
    ================================================== */

    function setupParticipantCardButtonObserver() {

        replaceParticipantHistoryButtons();


        const observer =
            new MutationObserver(
                () => {

                    replaceParticipantHistoryButtons();

                }
            );


        const target =
            document.getElementById(
                "participantsTable"
            );


        if (target) {

            observer.observe(
                target,
                {
                    childList: true,
                    subtree: true
                }
            );

        }

    }


    /* ==================================================
       参加履歴ボタン → 参加者カルテ
    ================================================== */

    function replaceParticipantHistoryButtons() {

        const buttons =
            document.querySelectorAll(
                '#participantsTable [data-action="participant-history"]'
            );


        buttons.forEach(
            button => {

                button.dataset.action =
                    "participant-card";


                button.textContent =
                    "参加者カルテ";

            }
        );

    }


    /* ==================================================
       カルテを開く
    ================================================== */

    async function openParticipantCard(
        databaseId
    ) {

        const modal =
            document.getElementById(
                "participantCardModal"
            );


        const title =
            document.getElementById(
                "participantCardTitle"
            );


        const content =
            document.getElementById(
                "participantCardContent"
            );


        if (!modal || !content) {
            return;
        }


        modal.classList.remove(
            "hidden"
        );


        content.innerHTML = `

            <div class="participant-card-loading">
                読み込み中...
            </div>

        `;


        try {

            /* ==================================================
               Supabase確認
            ================================================== */

            if (
                typeof adminSupabaseClient ===
                "undefined" ||
                !adminSupabaseClient
            ) {

                throw new Error(
                    "Supabaseクライアントが初期化されていません。"
                );

            }


            /* ==================================================
               参加者取得
            ================================================== */

            const {
                data: participant,
                error: participantError
            } =
                await adminSupabaseClient
                    .from("participants")
                    .select("*")
                    .eq(
                        "id",
                        databaseId
                    )
                    .single();


            if (participantError) {
                throw participantError;
            }


            if (!participant) {

                throw new Error(
                    "参加者が見つかりませんでした。"
                );

            }


            title.textContent =
                `${participant.name || "名前未登録"}さんの参加者カルテ`;


            /* ==================================================
               参加履歴取得
            ================================================== */

            const {
                data: participations,
                error: participationError
            } =
                await adminSupabaseClient
                    .from("participations")
                    .select(
                        "id, participant_id, training_id, registered_at"
                    )
                    .eq(
                        "participant_id",
                        participant.participant_id
                    );


            if (participationError) {
                throw participationError;
            }


            const history =
                participations || [];


            /* ==================================================
               訓練取得

               trainig_date が正式なカラム
            ================================================== */

            const {
    data: trainings,
    error: trainingError
} =
    await adminSupabaseClient
        .from("trainings")
        .select("*");


            if (trainingError) {
                throw trainingError;
            }


            const trainingList =
                trainings || [];


            /* ==================================================
               参加履歴を訓練情報と結合
            ================================================== */

            const detailedHistory =
                history
                    .map(
                        item => {

                            const training =
                                trainingList.find(
                                    training =>
                                        String(
                                            training.training_id
                                        ) ===
                                        String(
                                            item.training_id
                                        )
                                );


                            return {
                                ...item,
                                training
                            };

                        }
                    );


            /* ==================================================
               実施日取得

               優先順位

               1. trainig_date
               2. date
               3. registered_at
            ================================================== */

            detailedHistory.forEach(
                item => {

                    item.eventDate =
                        getTrainingDate(
                            item.training,
                            item.registered_at
                        );

                }
            );


            /* ==================================================
               日付順に並び替え

               新しいもの → 古いもの
            ================================================== */

            detailedHistory.sort(
                (a, b) => {

                    return (
                        getDateTimestamp(
                            b.eventDate
                        ) -
                        getDateTimestamp(
                            a.eventDate
                        )
                    );

                }
            );


            /* ==================================================
               集計
            ================================================== */

            const count =
                detailedHistory.length;


            const fiscalYearHistory =
                detailedHistory.filter(
                    item =>
                        isInFiscalYear(
                            item.eventDate,
                            CURRENT_FISCAL_YEAR
                        )
                );


            const fiscalYearCount =
                fiscalYearHistory.length;


            const uniqueTrainingIds =
                new Set(
                    detailedHistory
                        .map(
                            item =>
                                item.training_id
                        )
                        .filter(Boolean)
                );


            const trainingCount =
                uniqueTrainingIds.size;


            /* ==================================================
               初回・最終参加
            ================================================== */

            const chronologicalHistory =
                [...detailedHistory]
                    .sort(
                        (a, b) => {

                            return (
                                getDateTimestamp(
                                    a.eventDate
                                ) -
                                getDateTimestamp(
                                    b.eventDate
                                )
                            );

                        }
                    );


            const first =
                chronologicalHistory.length
                    ? chronologicalHistory[0]
                    : null;


            const latest =
                chronologicalHistory.length
                    ? chronologicalHistory[
                        chronologicalHistory.length - 1
                    ]
                    : null;


            /* ==================================================
               参加状態
            ================================================== */

            let participationStatus =
                "未参加";


            let participationStatusClass =
                "inactive";


            if (count === 1) {

                participationStatus =
                    "初参加";

                participationStatusClass =
                    "active";

            }


            if (count >= 2) {

                participationStatus =
                    "リピーター";

                participationStatusClass =
                    "repeat";

            }


            /* ==================================================
               マイスター判定
            ================================================== */

            const certified =
                count >=
                CERTIFICATION_TARGET;


            const progress =
                Math.min(
                    (
                        count /
                        CERTIFICATION_TARGET
                    ) *
                    100,
                    100
                );


            const remaining =
                Math.max(
                    CERTIFICATION_TARGET -
                    count,
                    0
                );


            /* ==================================================
               HTML
            ================================================== */

            content.innerHTML = `

                <div class="participant-card">


                    <!-- =================================
                         基本情報
                    ================================= -->

                    <div
                        class="
                            participant-card-profile
                        "
                    >

                        <div
                            class="
                                participant-card-profile-main
                            "
                        >

                            <div
                                class="
                                    participant-card-eyebrow
                                "
                            >
                                PARTICIPANT
                            </div>


                            <h3>
                                ${escapeHtml(
                                    participant.name ||
                                    "名前未登録"
                                )}
                            </h3>


                            <p>
                                参加者ID：
                                ${escapeHtml(
                                    participant.participant_id ||
                                    "-"
                                )}
                            </p>

                        </div>


                        <div
                            class="
                                participant-card-status
                                ${certified
                                    ? "certified"
                                    : "not-certified"
                                }
                            "
                        >

                            ${
                                certified
                                    ? "防災マイスター認定"
                                    : participationStatus
                            }

                        </div>

                    </div>


                    <!-- =================================
                         参加状況
                    ================================= -->

                    <div
                        class="
                            participant-card-info
                        "
                    >

                        <div>

                            <span>
                                参加状況
                            </span>

                            <strong
                                class="
                                    analysis-status
                                    ${participationStatusClass}
                                "
                            >
                                ${participationStatus}
                            </strong>

                        </div>

                    </div>


                    <!-- =================================
                         統計
                    ================================= -->

                    <div
                        class="
                            participant-card-stat-grid
                        "
                    >


                        <div
                            class="
                                participant-card-stat
                            "
                        >

                            <span>
                                総参加回数
                            </span>

                            <strong>
                                ${count}
                            </strong>

                            <small>
                                回
                            </small>

                        </div>


                        <div
                            class="
                                participant-card-stat
                            "
                        >

                            <span>
                                2026年度
                            </span>

                            <strong>
                                ${fiscalYearCount}
                            </strong>

                            <small>
                                回
                            </small>

                        </div>


                        <div
                            class="
                                participant-card-stat
                            "
                        >

                            <span>
                                参加種類
                            </span>

                            <strong>
                                ${trainingCount}
                            </strong>

                            <small>
                                種類
                            </small>

                        </div>


                        <div
                            class="
                                participant-card-stat
                            "
                        >

                            <span>
                                最終参加
                            </span>

                            <strong>
                                ${
                                    latest
                                        ? formatDate(
                                            latest.eventDate
                                        )
                                        : "-"
                                }
                            </strong>

                        </div>


                    </div>


                    <!-- =================================
                         初回・最終参加
                    ================================= -->

                    <div
                        class="
                            participant-card-info
                        "
                    >

                        <div>

                            <span>
                                初回参加日
                            </span>

                            <strong>
                                ${
                                    first
                                        ? formatDate(
                                            first.eventDate
                                        )
                                        : "-"
                                }
                            </strong>

                        </div>


                        <div>

                            <span>
                                最終参加日
                            </span>

                            <strong>
                                ${
                                    latest
                                        ? formatDate(
                                            latest.eventDate
                                        )
                                        : "-"
                                }
                            </strong>

                        </div>


                        <div>

                            <span>
                                登録日
                            </span>

                            <strong>
                                ${
                                    participant.created_at
                                        ? formatDate(
                                            participant.created_at
                                        )
                                        : "-"
                                }
                            </strong>

                        </div>

                    </div>


                    <!-- =================================
                         年度状況
                    ================================= -->

                    <div
                        class="
                            participant-card-progress
                        "
                    >

                        <div
                            class="
                                participant-card-progress-header
                            "
                        >

                            <div>

                                <strong>
                                    2026年度の参加状況
                                </strong>

                                <span>
                                    今年度の訓練・講座への参加
                                </span>

                            </div>


                            <strong>
                                ${fiscalYearCount}回
                            </strong>

                        </div>


                        ${
                            fiscalYearCount === 0

                                ? `

                                    <p>
                                        2026年度はまだ参加していません。
                                    </p>

                                  `

                                : `

                                    <p>
                                        2026年度に
                                        ${fiscalYearCount}回
                                        参加しています。
                                    </p>

                                  `
                        }

                    </div>


                    <!-- =================================
                         マイスター進捗
                    ================================= -->

                    <div
                        class="
                            participant-card-progress
                        "
                    >

                        <div
                            class="
                                participant-card-progress-header
                            "
                        >

                            <div>

                                <strong>
                                    防災マイスター認定状況
                                </strong>

                                <span>
                                    5回参加で認定
                                </span>

                            </div>


                            <strong>
                                ${Math.min(
                                    count,
                                    CERTIFICATION_TARGET
                                )}
                                /
                                ${CERTIFICATION_TARGET}
                            </strong>

                        </div>


                        <div
                            class="
                                participant-card-progress-track
                            "
                        >

                            <div
                                class="
                                    participant-card-progress-bar
                                "
                                style="
                                    width: ${progress}%;
                                "
                            ></div>

                        </div>


                        <p>

                            ${
                                certified
                                    ? "認定条件を達成しています。"

                                    : `あと${remaining}回の参加で認定です。`
                            }

                        </p>

                    </div>


                    <!-- =================================
                         参加履歴
                    ================================= -->

                    <div
                        class="
                            participant-card-history
                        "
                    >

                        <div
                            class="
                                participant-card-section-title
                            "
                        >

                            <div>

                                <h3>
                                    参加履歴
                                </h3>

                                <p>
                                    この参加者のすべての参加記録
                                </p>

                            </div>


                            <span>
                                ${count}件
                            </span>

                        </div>


                        ${
                            detailedHistory.length === 0

                                ? `

                                    <div
                                        class="
                                            participant-card-empty
                                        "
                                    >
                                        参加履歴はありません。
                                    </div>

                                  `

                                : `

                                    <div
                                        class="
                                            participant-card-history-list
                                        "
                                    >

                                        ${detailedHistory
                                            .map(
                                                item => {

                                                    const training =
                                                        item.training;


                                                    const title =
                                                        training?.title ||
                                                        item.training_id ||
                                                        "訓練・講座";


                                                    const date =
                                                        item.eventDate
                                                            ? formatDate(
                                                                item.eventDate
                                                            )
                                                            : "-";


                                                    const location =
                                                        training?.location ||
                                                        "";


                                                    const registeredAt =
                                                        item.registered_at
                                                            ? formatDate(
                                                                item.registered_at
                                                            )
                                                            : "";


                                                    return `

                                                        <div
                                                            class="
                                                                participant-card-history-item
                                                            "
                                                            data-history-id="
                                                                ${item.id}
                                                            "
                                                        >

                                                            <div>

                                                                <strong>
                                                                    ${escapeHtml(
                                                                        title
                                                                    )}
                                                                </strong>


                                                                <span>
                                                                    実施日：
                                                                    ${escapeHtml(
                                                                        date
                                                                    )}
                                                                </span>


                                                                ${
                                                                    location

                                                                        ? `

                                                                            <span>
                                                                                場所：
                                                                                ${escapeHtml(
                                                                                    location
                                                                                )}
                                                                            </span>

                                                                          `

                                                                        : ""
                                                                }


                                                                ${
                                                                    registeredAt

                                                                        ? `

                                                                            <span>
                                                                                登録日：
                                                                                ${escapeHtml(
                                                                                    registeredAt
                                                                                )}
                                                                            </span>

                                                                          `

                                                                        : ""
                                                                }

                                                            </div>


                                                            <button
                                                                type="button"
                                                                class="
                                                                    action-button
                                                                    delete-button
                                                                    participant-card-delete
                                                                "
                                                                data-participation-id="
                                                                    ${item.id}
                                                                "
                                                            >
                                                                削除
                                                            </button>

                                                        </div>

                                                    `;

                                                }
                                            )
                                            .join("")}

                                    </div>

                                  `
                        }

                    </div>


                </div>

            `;


            /* ==================================================
               履歴削除
            ================================================== */

            content
                .querySelectorAll(
                    ".participant-card-delete"
                )
                .forEach(
                    button => {

                        button.addEventListener(
                            "click",
                            async () => {

                                const id =
                                    button.dataset
                                        .participationId;


                                if (
                                    !confirm(
                                        "この参加記録を削除しますか？"
                                    )
                                ) {

                                    return;

                                }


                                try {

                                    const {
                                        error
                                    } =
                                        await adminSupabaseClient
                                            .from(
                                                "participations"
                                            )
                                            .delete()
                                            .eq(
                                                "id",
                                                id
                                            );


                                    if (error) {
                                        throw error;
                                    }


                                    await openParticipantCard(
                                        databaseId
                                    );


                                    if (
                                        typeof loadAllData ===
                                        "function"
                                    ) {

                                        await loadAllData();

                                    }


                                } catch (error) {

                                    console.error(
                                        "Delete participation error:",
                                        error
                                    );


                                    alert(
                                        "参加記録の削除に失敗しました。\n" +
                                        (
                                            error.message ||
                                            "不明なエラー"
                                        )
                                    );

                                }

                            }
                        );

                    }
                );


        } catch (error) {

            console.error(
                "Participant card error:",
                error
            );


            content.innerHTML = `

                <div
                    class="
                        participant-card-error
                    "
                >

                    参加者カルテの読み込みに失敗しました。

                    <br><br>

                    ${escapeHtml(
                        error.message ||
                        "不明なエラー"
                    )}

                </div>

            `;

        }

    }


    /* ==================================================
       訓練実施日取得
    ================================================== */

    function getTrainingDate(
        training,
        fallbackDate
    ) {

        if (!training) {

            return fallbackDate || null;

        }


        /*
         * 正式なDBカラム
         * trainig_date
         */

        if (
            training.trainig_date
        ) {

            return training.trainig_date;

        }


        /*
         * 互換用
         * 万一 date に値がある場合
         */

        if (
            training.date
        ) {

            return training.date;

        }


        return fallbackDate || null;

    }


    /* ==================================================
       年度判定
       
       2026年度
       2026/04/01
       ～ 2027/03/31
    ================================================== */

    function isInFiscalYear(
        dateValue,
        fiscalYear
    ) {

        if (!dateValue) {
            return false;
        }


        const date =
            parseDateValue(
                dateValue
            );


        if (!date) {
            return false;
        }


        const start =
            new Date(
                fiscalYear,
                3,
                1
            );


        const end =
            new Date(
                fiscalYear + 1,
                2,
                31,
                23,
                59,
                59,
                999
            );


        return (
            date >= start &&
            date <= end
        );

    }


    /* ==================================================
       日付 → timestamp
    ================================================== */

    function getDateTimestamp(
        value
    ) {

        const date =
            parseDateValue(
                value
            );


        if (!date) {
            return 0;
        }


        return date.getTime();

    }


    /* ==================================================
       日付解析
    ================================================== */

    function parseDateValue(
        value
    ) {

        if (!value) {
            return null;
        }


        if (
            value instanceof Date
        ) {

            return isNaN(
                value.getTime()
            )
                ? null
                : value;

        }


        const text =
            String(value)
                .trim();


        if (!text) {
            return null;
        }


        /*
         * YYYY-MM-DD
         */

        if (
            /^\d{4}-\d{2}-\d{2}$/.test(
                text
            )
        ) {

            const [
                year,
                month,
                day
            ] =
                text
                    .split("-")
                    .map(Number);


            const date =
                new Date(
                    year,
                    month - 1,
                    day
                );


            return isNaN(
                date.getTime()
            )
                ? null
                : date;

        }


        /*
         * ISO日時
         */

        const parsed =
            new Date(text);


        return isNaN(
            parsed.getTime()
        )
            ? null
            : parsed;

    }


    /* ==================================================
       日付表示
    ================================================== */

    function formatDate(
        value
    ) {

        if (!value) {
            return "-";
        }


        const date =
            parseDateValue(
                value
            );


        if (!date) {
            return "-";
        }


        return `${date.getFullYear()}/` +
            `${String(
                date.getMonth() + 1
            ).padStart(2, "0")}/` +
            `${String(
                date.getDate()
            ).padStart(2, "0")}`;

    }


    /* ==================================================
       閉じる
    ================================================== */

    function closeParticipantCard() {

        const modal =
            document.getElementById(
                "participantCardModal"
            );


        if (modal) {

            modal.classList.add(
                "hidden"
            );

        }

    }


    /* ==================================================
       HTMLエスケープ
    ================================================== */

    function escapeHtml(
        value
    ) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }


        return String(value)

            .replace(
                /&/g,
                "&amp;"
            )

            .replace(
                /</g,
                "&lt;"
            )

            .replace(
                />/g,
                "&gt;"
            )

            .replace(
                /"/g,
                "&quot;"
            )

            .replace(
                /'/g,
                "&#039;"
            );

    }


})();
