/* ==================================================
岩瀬自治会 防災アプリ
管理者画面
Supabase Auth対応
================================================== */

/* ==================================================
Supabase設定
================================================== */

const ADMIN_SUPABASE_URL =
"https://zumbqukrojdpgfpfekjr.supabase.co";

const ADMIN_SUPABASE_PUBLISHABLE_KEY =
"sb_publishable_8YXsMHOxLr7MOTEYShUM3w_LsZvR3Qn";

let adminSupabaseClient = null;

/* ==================================================
Supabase初期化
================================================== */

try {

if (
    typeof window.supabase ===
    "undefined"
) {

    throw new Error(
        "Supabase JavaScriptライブラリが読み込まれていません。"
    );

}


adminSupabaseClient =
    window.supabase.createClient(
        ADMIN_SUPABASE_URL,
        ADMIN_SUPABASE_PUBLISHABLE_KEY
    );


console.log(
    "Admin Supabase client initialized."
);

} catch (error) {

console.error(
    "Supabase initialization error:",
    error
);

}

/* ==================================================
DOM
================================================== */

const loginScreen =
document.getElementById(
"loginScreen"
);

const adminScreen =
document.getElementById(
"adminScreen"
);

const loginForm =
document.getElementById(
"loginForm"
);

const loginError =
document.getElementById(
"loginError"
);

const logoutButton =
document.getElementById(
"logoutButton"
);

/* ==================================================
初期化
================================================== */

document.addEventListener(
"DOMContentLoaded",
async () => {

    console.log(
        "Admin page initialized."
    );


    setupNavigation();

    setupParticipantModal();

    setupParticipantHistoryModal();

    setupTrainingModal();

    setupTrainingParticipantsModal();


    await checkAuth();

}

);

/* ==================================================
Supabase確認
================================================== */

function checkSupabaseClient() {

if (
    !adminSupabaseClient
) {

    throw new Error(
        "Supabaseクライアントが初期化されていません。"
    );

}


if (
    !adminSupabaseClient.auth
) {

    throw new Error(
        "Supabase Authが利用できません。"
    );

}

}

/* ==================================================
認証確認
================================================== */

async function checkAuth() {

try {

    checkSupabaseClient();


    const {
        data,
        error
    } =
        await adminSupabaseClient
            .auth
            .getSession();


    if (error) {

        throw error;

    }


    if (
        data &&
        data.session
    ) {

        console.log(
            "管理者ログイン済み"
        );


        showAdminScreen();


        await loadAllData();


    } else {

        showLoginScreen();

    }


} catch (error) {

    console.error(
        "Authentication error:",
        error
    );


    showLoginScreen();

}

}

/* ==================================================
ログイン
================================================== */

if (loginForm) {

loginForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        loginError.textContent =
            "";


        const email =
            document
                .getElementById(
                    "email"
                )
                .value
                .trim();


        const password =
            document
                .getElementById(
                    "password"
                )
                .value;


        if (
            !email ||
            !password
        ) {

            loginError.textContent =
                "メールアドレスとパスワードを入力してください。";

            return;

        }


        try {

            checkSupabaseClient();


            const {
                data,
                error
            } =
                await adminSupabaseClient
                    .auth
                    .signInWithPassword({

                        email:
                            email,

                        password:
                            password

                    });


            if (error) {

                throw error;

            }


            if (
                !data ||
                !data.session
            ) {

                throw new Error(
                    "ログインセッションを取得できませんでした。"
                );

            }


            showAdminScreen();


            await loadAllData();


        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            loginError.textContent =
                "ログインできませんでした。\n" +
                error.message;

        }

    }
);

}

/* ==================================================
ログアウト
================================================== */

if (logoutButton) {

logoutButton.addEventListener(
    "click",
    async () => {

        if (
            !confirm(
                "ログアウトしますか？"
            )
        ) {

            return;

        }


        try {

            checkSupabaseClient();


            const {
                error
            } =
                await adminSupabaseClient
                    .auth
                    .signOut();


            if (error) {

                throw error;

            }


            showLoginScreen();


        } catch (error) {

            console.error(
                "Logout error:",
                error
            );


            alert(
                "ログアウトに失敗しました。\n" +
                error.message
            );

        }

    }
);

}

/* ==================================================
Auth状態監視
================================================== */

if (
adminSupabaseClient &&
adminSupabaseClient.auth
) {

adminSupabaseClient
    .auth
    .onAuthStateChange(
        (event, session) => {

            console.log(
                "Auth state:",
                event
            );


            if (
                session &&
                event !==
                "SIGNED_OUT"
            ) {

                showAdminScreen();

            }


            if (
                !session ||
                event ===
                "SIGNED_OUT"
            ) {

                showLoginScreen();

            }

        }
    );

}

/* ==================================================
画面表示
================================================== */

function showLoginScreen() {

if (loginScreen) {

    loginScreen.classList.remove(
        "hidden"
    );

}


if (adminScreen) {

    adminScreen.classList.add(
        "hidden"
    );

}

}

function showAdminScreen() {

if (loginScreen) {

    loginScreen.classList.add(
        "hidden"
    );

}


if (adminScreen) {

    adminScreen.classList.remove(
        "hidden"
    );

}

}

/* ==================================================
ナビゲーション
================================================== */

function setupNavigation() {

const buttons =
    document.querySelectorAll(
        ".nav-button"
    );


buttons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            const target =
                button.dataset.target;


            document
                .querySelectorAll(
                    ".content-section"
                )
                .forEach(section => {

                    section.classList.add(
                        "hidden"
                    );

                });


            const targetSection =
                document.getElementById(
                    target
                );


            if (targetSection) {

                targetSection.classList.remove(
                    "hidden"
                );

            }


            buttons.forEach(item => {

                item.classList.remove(
                    "active"
                );

            });


            button.classList.add(
                "active"
            );

        }
    );

});

}

/* ==================================================
全データ読み込み
================================================== */

async function loadAllData() {

console.log(
    "管理データ読み込み開始"
);


await loadParticipants();

await loadTrainings();

await loadParticipations();

await loadDashboard();


console.log(
    "管理データ読み込み完了"
);

}

/* ==================================================
ダッシュボード
================================================== */

async function loadDashboard() {

try {

    const [
        participantsResult,
        trainingsResult,
        participationsResult
    ] =
        await Promise.all([

            adminSupabaseClient
                .from("participants")
                .select("*", {
                    count: "exact",
                    head: true
                }),


            adminSupabaseClient
                .from("trainings")
                .select("*", {
                    count: "exact",
                    head: true
                }),


            adminSupabaseClient
                .from("participations")
                .select("*", {
                    count: "exact",
                    head: true
                })

        ]);


    if (
        participantsResult.error
    ) {

        throw participantsResult.error;

    }


    if (
        trainingsResult.error
    ) {

        throw trainingsResult.error;

    }


    if (
        participationsResult.error
    ) {

        throw participationsResult.error;

    }


    document.getElementById(
        "participantCount"
    ).textContent =
        participantsResult.count ?? 0;


    document.getElementById(
        "trainingCount"
    ).textContent =
        trainingsResult.count ?? 0;


    document.getElementById(
        "participationCount"
    ).textContent =
        participationsResult.count ?? 0;


    await loadRecentParticipations();


} catch (error) {

    console.error(
        "Dashboard error:",
        error
    );

}

}

/* ==================================================
最近の参加記録
================================================== */

async function loadRecentParticipations() {

const container =
    document.getElementById(
        "recentParticipations"
    );


if (!container) {

    return;

}


const {
    data,
    error
} =
    await adminSupabaseClient
        .from("participations")
        .select(
            "id, registered_at, participant_id, training_id"
        )
        .order(
            "registered_at",
            {
                ascending: false
            }
        )
        .limit(10);


if (error) {

    console.error(error);

    container.textContent =
        "読み込みに失敗しました。";

    return;

}


if (
    !data ||
    data.length === 0
) {

    container.innerHTML =
        `<div class="empty-message">
            まだ参加記録がありません。
        </div>`;

    return;

}


const [
    participantsResult,
    trainingsResult
] =
    await Promise.all([

        adminSupabaseClient
            .from("participants")
            .select(
                "participant_id, name"
            ),


        adminSupabaseClient
            .from("trainings")
            .select(
                "training_id, title"
            )

    ]);


const participants =
    participantsResult.data || [];


const trainings =
    trainingsResult.data || [];


container.innerHTML = "";


data.forEach(item => {

    const participant =
        participants.find(
            p =>
                p.participant_id ===
                item.participant_id
        );


    const training =
        trainings.find(
            t =>
                t.training_id ===
                item.training_id
        );


    const div =
        document.createElement(
            "div"
        );


    div.className =
        "recent-item";


    div.textContent =
        `${participant?.name || "不明な参加者"}　` +
        `${training?.title || item.training_id}　` +
        `${formatDate(
            item.registered_at
        )}`;


    container.appendChild(div);

});

}

/* ==================================================
参加者管理
================================================== */

async function loadParticipants() {

const tbody =
    document.getElementById(
        "participantsTable"
    );


if (!tbody) {

    return;

}


tbody.innerHTML =
    `<tr>
        <td colspan="4">
            読み込み中...
        </td>
    </tr>`;


const {
    data,
    error
} =
    await adminSupabaseClient
        .from("participants")
        .select("*")
        .order(
            "created_at",
            {
                ascending: false
            }
        );


if (error) {

    console.error(
        "Participants error:",
        error
    );


    tbody.innerHTML =
        `<tr>
            <td colspan="4">
                読み込みに失敗しました。
            </td>
        </tr>`;

    return;

}


const {
    data: participations,
    error:
        participationError
} =
    await adminSupabaseClient
        .from("participations")
        .select(
            "participant_id"
        );


if (participationError) {

    console.error(
        participationError
    );

}


const participationList =
    participations || [];


tbody.innerHTML = "";


if (
    !data ||
    data.length === 0
) {

    tbody.innerHTML =
        `<tr>
            <td colspan="4">
                参加者はいません。
            </td>
        </tr>`;

    return;

}


data.forEach(participant => {

    const count =
        participationList.filter(
            item =>
                item.participant_id ===
                participant.participant_id
        ).length;


    const tr =
        document.createElement(
            "tr"
        );


    tr.innerHTML = `

        <td>
            <strong>
                ${escapeHtml(
                    participant.name ||
                    "名前未登録"
                )}
            </strong>
        </td>

        <td>
            <span class="participant-count">
                ${count}回
            </span>
        </td>

        <td>
            ${formatDate(
                participant.created_at
            )}
        </td>

        <td>

            <button
                class="action-button view-button"
                data-action="participant-history"
                data-id="${participant.id}"
            >
                参加履歴
            </button>

            <button
                class="action-button edit-button"
                data-action="edit-participant"
                data-id="${participant.id}"
            >
                編集
            </button>

            <button
                class="action-button delete-button"
                data-action="delete-participant"
                data-id="${participant.id}"
            >
                削除
            </button>

        </td>

    `;


    tbody.appendChild(tr);

});


tbody
    .querySelectorAll(
        '[data-action="participant-history"]'
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const participant =
                    data.find(
                        item =>
                            item.id ===
                            button.dataset.id
                    );


                if (participant) {

                    openParticipantHistory(
                        participant
                    );

                }

            }
        );

    });


tbody
    .querySelectorAll(
        '[data-action="edit-participant"]'
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const participant =
                    data.find(
                        item =>
                            item.id ===
                            button.dataset.id
                    );


                if (participant) {

                    openParticipantModal(
                        participant
                    );

                }

            }
        );

    });


tbody
    .querySelectorAll(
        '[data-action="delete-participant"]'
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                deleteParticipant(
                    button.dataset.id
                );

            }
        );

    });

}

/* ==================================================
参加者編集
================================================== */

function setupParticipantModal() {

document
    .getElementById(
        "cancelParticipantButton"
    )
    ?.addEventListener(
        "click",
        closeParticipantModal
    );


document
    .getElementById(
        "saveParticipantButton"
    )
    ?.addEventListener(
        "click",
        saveParticipant
    );

}

function openParticipantModal(
participant
) {

document.getElementById(
    "editParticipantDbId"
).value =
    participant.id;


document.getElementById(
    "editParticipantId"
).value =
    participant.participant_id;


document.getElementById(
    "editParticipantName"
).value =
    participant.name || "";


document.getElementById(
    "participantModal"
).classList.remove(
    "hidden"
);

}

function closeParticipantModal() {

document.getElementById(
    "participantModal"
).classList.add(
    "hidden"
);

}

/* ==================================================
参加者編集保存
================================================== */

async function saveParticipant() {

const id =
    document.getElementById(
        "editParticipantDbId"
    ).value;


const name =
    document.getElementById(
        "editParticipantName"
    ).value
    .trim();


if (!name) {

    alert(
        "名前を入力してください。"
    );

    return;

}


try {

    const {
        error
    } =
        await adminSupabaseClient
            .from("participants")
            .update({
                name: name
            })
            .eq(
                "id",
                id
            );


    if (error) {

        throw error;

    }


    closeParticipantModal();

    await loadAllData();


    alert(
        "参加者情報を更新しました。"
    );


} catch (error) {

    console.error(
        "Participant update error:",
        error
    );


    alert(
        "保存に失敗しました。\n" +
        error.message
    );

}

}

/* ==================================================
参加者削除
================================================== */

async function deleteParticipant(id) {

if (
    !confirm(
        "この参加者を削除しますか？\n\n" +
        "この参加者の参加履歴も削除されます。"
    )
) {

    return;

}


try {

    const {
        data: participant,
        error:
            participantError
    } =
        await adminSupabaseClient
            .from("participants")
            .select(
                "participant_id"
            )
            .eq(
                "id",
                id
            )
            .single();


    if (participantError) {

        throw participantError;

    }


    const participantId =
        participant.participant_id;


    const {
        error:
            participationError
    } =
        await adminSupabaseClient
            .from("participations")
            .delete()
            .eq(
                "participant_id",
                participantId
            );


    if (participationError) {

        throw participationError;

    }


    const {
        error
    } =
        await adminSupabaseClient
            .from("participants")
            .delete()
            .eq(
                "id",
                id
            );


    if (error) {

        throw error;

    }


    await loadAllData();


    alert(
        "参加者を削除しました。"
    );


} catch (error) {

    console.error(
        "Participant delete error:",
        error
    );


    alert(
        "参加者の削除に失敗しました。\n" +
        error.message
    );

}

}

/* ==================================================
参加者の参加履歴
================================================== */

function setupParticipantHistoryModal() {

document
    .getElementById(
        "closeParticipantHistoryButton"
    )
    ?.addEventListener(
        "click",
        closeParticipantHistory
    );

}

async function openParticipantHistory(
participant
) {

const modal =
    document.getElementById(
        "participantHistoryModal"
    );


const title =
    document.getElementById(
        "participantHistoryTitle"
    );


const content =
    document.getElementById(
        "participantHistoryContent"
    );


title.textContent =
    `${participant.name || "名前未登録"}さんの参加履歴`;


content.innerHTML =
    "読み込み中...";


modal.classList.remove(
    "hidden"
);


try {

    const {
        data,
        error
    } =
        await adminSupabaseClient
            .from("participations")
            .select(
                "id, registered_at, training_id"
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


    if (error) {

        throw error;

    }


    if (
        !data ||
        data.length === 0
    ) {

        content.innerHTML =
            `<div class="empty-message">
                参加履歴はありません。
            </div>`;

        return;

    }


    const {
        data: trainings,
        error:
            trainingError
    } =
        await adminSupabaseClient
            .from("trainings")
            .select(
                "training_id, title"
            );


    if (trainingError) {

        throw trainingError;

    }


    content.innerHTML = `

        <div class="history-summary">
            参加回数：${data.length}回
        </div>

        <div class="history-list"></div>

    `;


    const list =
        content.querySelector(
            ".history-list"
        );


    data.forEach(item => {

        const training =
            trainings.find(
                t =>
                    t.training_id ===
                    item.training_id
            );


        const div =
            document.createElement(
                "div"
            );


        div.className =
            "history-item";


        div.innerHTML = `

            <div class="history-main">

                <div class="history-title">
                    ${escapeHtml(
                        training?.title ||
                        item.training_id
                    )}
                </div>

                <div class="history-date">
                    ${formatDate(
                        item.registered_at
                    )}
                </div>

            </div>

            <button
                type="button"
                class="action-button delete-button"
                data-history-id="${item.id}"
            >
                削除
            </button>

        `;


        list.appendChild(div);


        div
            .querySelector(
                "[data-history-id]"
            )
            .addEventListener(
                "click",
                async () => {

                    await deleteParticipation(
                        item.id
                    );


                    openParticipantHistory(
                        participant
                    );

                }
            );

    });


} catch (error) {

    console.error(
        "Participant history error:",
        error
    );


    content.innerHTML =
        `<div class="empty-message">
            読み込みに失敗しました。
        </div>`;

}

}

function closeParticipantHistory() {

document.getElementById(
    "participantHistoryModal"
).classList.add(
    "hidden"
);

}

/* ==================================================
訓練一覧
================================================== */

async function loadTrainings() {

const tbody =
    document.getElementById(
        "trainingsTable"
    );


if (!tbody) {

    return;

}


tbody.innerHTML =
    `<tr>
        <td colspan="5">
            読み込み中...
        </td>
    </tr>`;


const {
    data,
    error
} =
    await adminSupabaseClient
        .from("trainings")
        .select("*")
        .order(
            "created_at",
            {
                ascending: false
            }
        );


if (error) {

    console.error(
        "Trainings error:",
        error
    );


    tbody.innerHTML =
        `<tr>
            <td colspan="5">
                読み込みに失敗しました。
            </td>
        </tr>`;

    return;

}


const {
    data: participations,
    error:
        participationError
} =
    await adminSupabaseClient
        .from("participations")
        .select(
            "training_id"
        );


if (participationError) {

    console.error(
        participationError
    );

}


const participationList =
    participations || [];


tbody.innerHTML = "";


if (
    !data ||
    data.length === 0
) {

    tbody.innerHTML =
        `<tr>
            <td colspan="5">
                訓練・講座はありません。
            </td>
        </tr>`;

    return;

}


data.forEach(training => {

    const count =
        participationList.filter(
            item =>
                item.training_id ===
                training.training_id
        ).length;


    const tr =
        document.createElement(
            "tr"
        );


    tr.innerHTML = `

        <td>
            ${escapeHtml(
                training.training_id
            )}
        </td>

        <td>
            <strong>
                ${escapeHtml(
                    training.title
                )}
            </strong>
        </td>

        <td>
            <span class="participant-count">
                ${count}人
            </span>
        </td>

        <td>
            ${formatDate(
                training.created_at
            )}
        </td>

        <td>

            <button
                class="action-button view-button"
                data-action="training-participants"
                data-id="${training.id}"
            >
                参加者を見る
            </button>

            <button
                class="action-button edit-button"
                data-action="edit-training"
                data-id="${training.id}"
            >
                編集
            </button>

            <button
                class="action-button delete-button"
                data-action="delete-training"
                data-id="${training.id}"
            >
                削除
            </button>

        </td>

    `;


    tbody.appendChild(tr);

});


tbody
    .querySelectorAll(
        '[data-action="training-participants"]'
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const training =
                    data.find(
                        item =>
                            item.id ===
                            button.dataset.id
                    );


                if (training) {

                    openTrainingParticipants(
                        training
                    );

                }

            }
        );

    });


tbody
    .querySelectorAll(
        '[data-action="edit-training"]'
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const training =
                    data.find(
                        item =>
                            item.id ===
                            button.dataset.id
                    );


                if (training) {

                    openTrainingModal(
                        training
                    );

                }

            }
        );

    });


tbody
    .querySelectorAll(
        '[data-action="delete-training"]'
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                deleteTraining(
                    button.dataset.id
                );

            }
        );

    });

}

/* ==================================================
訓練参加者一覧
================================================== */

function setupTrainingParticipantsModal() {

document
    .getElementById(
        "closeTrainingParticipantsButton"
    )
    ?.addEventListener(
        "click",
        closeTrainingParticipants
    );

}

async function openTrainingParticipants(
training
) {

const modal =
    document.getElementById(
        "trainingParticipantsModal"
    );


const title =
    document.getElementById(
        "trainingParticipantsTitle"
    );


const content =
    document.getElementById(
        "trainingParticipantsContent"
    );


title.textContent =
    `${training.title}：参加者一覧`;


content.innerHTML =
    "読み込み中...";


modal.classList.remove(
    "hidden"
);


try {

    const {
        data,
        error
    } =
        await adminSupabaseClient
            .from("participations")
            .select(
                "id, participant_id, registered_at"
            )
            .eq(
                "training_id",
                training.training_id
            )
            .order(
                "registered_at",
                {
                    ascending: true
                }
            );


    if (error) {

        throw error;

    }


    if (
        !data ||
        data.length === 0
    ) {

        content.innerHTML =
            `<div class="empty-message">
                この訓練への参加者はいません。
            </div>`;

        return;

    }


    const {
        data: participants,
        error:
            participantError
    } =
        await adminSupabaseClient
            .from("participants")
            .select(
                "participant_id, name"
            );


    if (participantError) {

        throw participantError;

    }


    content.innerHTML = `

        <div class="history-summary">
            参加人数：${data.length}人
        </div>

        <div class="history-list"></div>

    `;


    const list =
        content.querySelector(
            ".history-list"
        );


    data.forEach(item => {

        const participant =
            participants.find(
                p =>
                    p.participant_id ===
                    item.participant_id
            );


        const div =
            document.createElement(
                "div"
            );


        div.className =
            "history-item";


        div.innerHTML = `

            <div class="history-main">

                <div class="history-title">
                    ${escapeHtml(
                        participant?.name ||
                        "名前未登録"
                    )}
                </div>

                <div class="history-date">
                    参加日時：
                    ${formatDate(
                        item.registered_at
                    )}
                </div>

            </div>

            <button
                type="button"
                class="action-button delete-button"
                data-history-id="${item.id}"
            >
                削除
            </button>

        `;


        list.appendChild(div);


        div
            .querySelector(
                "[data-history-id]"
            )
            .addEventListener(
                "click",
                async () => {

                    await deleteParticipation(
                        item.id
                    );


                    openTrainingParticipants(
                        training
                    );

                }
            );

    });


} catch (error) {

    console.error(
        "Training participants error:",
        error
    );


    content.innerHTML =
        `<div class="empty-message">
            読み込みに失敗しました。
        </div>`;

}

}

function closeTrainingParticipants() {

document.getElementById(
    "trainingParticipantsModal"
).classList.add(
    "hidden"
);

}

/* ==================================================
訓練モーダル
================================================== */

function setupTrainingModal() {

document
    .getElementById(
        "addTrainingButton"
    )
    ?.addEventListener(
        "click",
        () => {

            openTrainingModal();

        }
    );


document
    .getElementById(
        "cancelTrainingButton"
    )
    ?.addEventListener(
        "click",
        closeTrainingModal
    );


document
    .getElementById(
        "saveTrainingButton"
    )
    ?.addEventListener(
        "click",
        saveTraining
    );

}

function openTrainingModal(
training = null
) {

document.getElementById(
    "editTrainingDbId"
).value =
    training?.id || "";


document.getElementById(
    "editTrainingId"
).value =
    training?.training_id || "";


document.getElementById(
    "editTrainingTitle"
).value =
    training?.title || "";


document.getElementById(
    "trainingModalTitle"
).textContent =
    training
        ? "訓練・講座を編集"
        : "訓練・講座を登録";


document.getElementById(
    "trainingModal"
).classList.remove(
    "hidden"
);

}

function closeTrainingModal() {

document.getElementById(
    "trainingModal"
).classList.add(
    "hidden"
);

}

/* ==================================================
訓練保存
================================================== */

async function saveTraining() {

const id =
    document.getElementById(
        "editTrainingDbId"
    ).value;


const trainingId =
    document.getElementById(
        "editTrainingId"
    ).value
    .trim();


const title =
    document.getElementById(
        "editTrainingTitle"
    ).value
    .trim();


if (!trainingId) {

    alert(
        "訓練IDを入力してください。"
    );

    return;

}


if (!title) {

    alert(
        "タイトルを入力してください。"
    );

    return;

}


try {

    let result;


    if (id) {

        result =
            await adminSupabaseClient
                .from("trainings")
                .update({

                    training_id:
                        trainingId,

                    title:
                        title

                })
                .eq(
                    "id",
                    id
                );

    } else {

        result =
            await adminSupabaseClient
                .from("trainings")
                .insert({

                    training_id:
                        trainingId,

                    title:
                        title

                });

    }


    if (result.error) {

        throw result.error;

    }


    closeTrainingModal();

    await loadAllData();


    alert(
        id
            ? "訓練情報を更新しました。"
            : "訓練を登録しました。"
    );


} catch (error) {

    console.error(
        "Training save error:",
        error
    );


    alert(
        "保存に失敗しました。\n" +
        error.message
    );

}

}

/* ==================================================
訓練削除
================================================== */

async function deleteTraining(id) {

if (
    !confirm(
        "この訓練・講座を削除しますか？\n\n" +
        "この訓練に紐づく参加履歴も削除されます。"
    )
) {

    return;

}


try {

    const {
        data: training,
        error:
            trainingError
    } =
        await adminSupabaseClient
            .from("trainings")
            .select(
                "training_id"
            )
            .eq(
                "id",
                id
            )
            .single();


    if (trainingError) {

        throw trainingError;

    }


    const trainingId =
        training.training_id;


    const {
        error:
            participationError
    } =
        await adminSupabaseClient
            .from("participations")
            .delete()
            .eq(
                "training_id",
                trainingId
            );


    if (participationError) {

        throw participationError;

    }


    const {
        error
    } =
        await adminSupabaseClient
            .from("trainings")
            .delete()
            .eq(
                "id",
                id
            );


    if (error) {

        throw error;

    }


    await loadAllData();


    alert(
        "訓練を削除しました。"
    );


} catch (error) {

    console.error(
        "Training delete error:",
        error
    );


    alert(
        "訓練の削除に失敗しました。\n" +
        error.message
    );

}

}

/* ==================================================
参加履歴一覧
================================================== */

async function loadParticipations() {

const tbody =
    document.getElementById(
        "participationsTable"
    );


if (!tbody) {

    return;

}


tbody.innerHTML =
    `<tr>
        <td colspan="4">
            読み込み中...
        </td>
    </tr>`;


const {
    data,
    error
} =
    await adminSupabaseClient
        .from("participations")
        .select(
            "id, registered_at, participant_id, training_id"
        )
        .order(
            "registered_at",
            {
                ascending: false
            }
        );


if (error) {

    console.error(
        "Participations error:",
        error
    );


    tbody.innerHTML =
        `<tr>
            <td colspan="4">
                読み込みに失敗しました。
            </td>
        </tr>`;

    return;

}


const [
    participantsResult,
    trainingsResult
] =
    await Promise.all([

        adminSupabaseClient
            .from("participants")
            .select(
                "participant_id, name"
            ),


        adminSupabaseClient
            .from("trainings")
            .select(
                "training_id, title"
            )

    ]);


const participants =
    participantsResult.data || [];


const trainings =
    trainingsResult.data || [];


tbody.innerHTML = "";


if (
    !data ||
    data.length === 0
) {

    tbody.innerHTML =
        `<tr>
            <td colspan="4">
                参加履歴はありません。
            </td>
        </tr>`;

    return;

}


data.forEach(participation => {

    const participant =
        participants.find(
            p =>
                p.participant_id ===
                participation.participant_id
        );


    const training =
        trainings.find(
            t =>
                t.training_id ===
                participation.training_id
        );


    const tr =
        document.createElement(
            "tr"
        );


    tr.innerHTML = `

        <td>
            ${escapeHtml(
                participant?.name ||
                "名前未登録"
            )}
        </td>

        <td>
            ${escapeHtml(
                training?.title ||
                participation.training_id
            )}
        </td>

        <td>
            ${formatDate(
                participation.registered_at
            )}
        </td>

        <td>

            <button
                class="action-button delete-button"
                data-action="delete-participation"
                data-id="${participation.id}"
            >
                削除
            </button>

        </td>

    `;


    tbody.appendChild(tr);

});


tbody
    .querySelectorAll(
        '[data-action="delete-participation"]'
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                deleteParticipation(
                    button.dataset.id
                );

            }
        );

    });

}

/* ==================================================
参加履歴削除
================================================== */

async function deleteParticipation(id) {

if (
    !confirm(
        "この参加履歴を削除しますか？"
    )
) {

    return;

}


try {

    const {
        error
    } =
        await adminSupabaseClient
            .from("participations")
            .delete()
            .eq(
                "id",
                id
            );


    if (error) {

        throw error;

    }


    await loadParticipations();

    await loadDashboard();

    await loadParticipants();

    await loadTrainings();


    alert(
        "参加履歴を削除しました。"
    );


} catch (error) {

    console.error(
        "Participation delete error:",
        error
    );


    alert(
        "削除に失敗しました。\n" +
        error.message
    );

}

}

/* ==================================================
日付
================================================== */

function formatDate(value) {

if (!value) {

    return "-";

}


const date =
    new Date(value);


if (
    Number.isNaN(
        date.getTime()
    )
) {

    return value;

}


return date.toLocaleString(
    "ja-JP",
    {

        year: "numeric",

        month: "2-digit",

        day: "2-digit",

        hour: "2-digit",

        minute: "2-digit"

    }
);

}

/* ==================================================
HTMLエスケープ
================================================== */

function escapeHtml(value) {

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
