/* ==================================================
   岩瀬自治会 防災アプリ
   参加者カルテ
   ================================================== */

(function () {

"use strict";


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

        <div class="modal-content large-modal participant-card-modal">

            <div class="participant-card-modal-header">

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


            openParticipantCard(
                id
            );

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


    modal.classList.remove(
        "hidden"
    );


    content.innerHTML =
        `
        <div class="participant-card-loading">
            読み込み中...
        </div>
        `;


    try {

        /* ------------------------------------------
           参加者
        ------------------------------------------ */

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


        /* ------------------------------------------
           参加履歴
        ------------------------------------------ */

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
                )
                .order(
                    "registered_at",
                    {
                        ascending: false
                    }
                );


        if (participationError) {
            throw participationError;
        }


        const history =
            participations || [];


        /* ------------------------------------------
           訓練・講座
        ------------------------------------------ */

        const {
            data: trainings,
            error: trainingError
        } =
            await adminSupabaseClient
                .from("trainings")
                .select(
                    "training_id, title"
                );


        if (trainingError) {
            throw trainingError;
        }


        const trainingList =
            trainings || [];


        /* ------------------------------------------
           集計
        ------------------------------------------ */

        const count =
            history.length;


        const first =
            history.length
                ? history[
                    history.length - 1
                ]
                : null;


        const latest =
            history.length
                ? history[0]
                : null;


        const uniqueTrainingIds =
            new Set(
                history
                    .map(
                        item =>
                            item.training_id
                    )
                    .filter(Boolean)
            );


        const trainingCount =
            uniqueTrainingIds.size;


        /* ------------------------------------------
           マイスター判定
           5回参加で認定
        ------------------------------------------ */

        const certificationTarget =
            5;


        const certified =
            count >=
            certificationTarget;


        const progress =
            Math.min(
                (
                    count /
                    certificationTarget
                ) *
                100,
                100
            );


        const remaining =
            Math.max(
                certificationTarget -
                count,
                0
            );


        /* ------------------------------------------
           HTML
        ------------------------------------------ */

        content.innerHTML = `

            <div class="participant-card">


                <!-- =================================
                     基本情報
                ================================= -->

                <div class="participant-card-profile">

                    <div class="participant-card-profile-main">

                        <div class="participant-card-eyebrow">
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
                                : "not-certified"}
                        "
                    >

                        ${
                            certified
                                ? "防災マイスター認定"
                                : "未認定"
                        }

                    </div>

                </div>


                <!-- =================================
                     統計
                ================================= -->

                <div class="participant-card-stat-grid">


                    <div class="participant-card-stat">

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


                    <div class="participant-card-stat">

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


                    <div class="participant-card-stat">

                        <span>
                            初回参加
                        </span>

                        <strong>
                            ${
                                first
                                    ? formatDate(
                                        first.registered_at
                                    )
                                    : "-"
                            }
                        </strong>

                    </div>


                    <div class="participant-card-stat">

                        <span>
                            最終参加
                        </span>

                        <strong>
                            ${
                                latest
                                    ? formatDate(
                                        latest.registered_at
                                    )
                                    : "-"
                            }
                        </strong>

                    </div>


                </div>


                <!-- =================================
                     登録情報
                ================================= -->

                <div class="participant-card-info">

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
                     マイスター進捗
                ================================= -->

                <div class="participant-card-progress">


                    <div
                        class="participant-card-progress-header"
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
                                certificationTarget
                            )}
                            /
                            ${certificationTarget}
                        </strong>

                    </div>


                    <div
                        class="participant-card-progress-track"
                    >

                        <div
                            class="participant-card-progress-bar"
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

                <div class="participant-card-history">


                    <div
                        class="participant-card-section-title"
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
                        history.length === 0

                            ? `

                                <div class="
                                    participant-card-empty
                                ">

                                    参加履歴はありません。

                                </div>

                              `

                            : `

                                <div
                                    class="
                                        participant-card-history-list
                                    "
                                >

                                    ${history.map(
                                        item => {

                                            const training =
                                                trainingList.find(
                                                    training =>
                                                        training.training_id ===
                                                        item.training_id
                                                );


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
                                                                training?.title ||
                                                                item.training_id ||
                                                                "訓練・講座"
                                                            )}

                                                        </strong>

                                                        <span>

                                                            ${formatDate(
                                                                item.registered_at
                                                            )}

                                                        </span>

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
                                    ).join("")}

                                </div>

                              `
                    }


                </div>


            </div>

        `;


        /* ------------------------------------------
           履歴削除
        ------------------------------------------ */

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
                                    error.message
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

            <div class="
                participant-card-error
            ">

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
