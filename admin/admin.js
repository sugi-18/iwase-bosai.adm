/* ==================================================
岩瀬自治会 防災アプリ
管理者画面
Supabase Auth対応
================================================== */

/* ==================================================
Supabase 管理者用クライアント
================================================== */

const ADMIN_SUPABASE_URL =
"https://zumbqukrojdpgfpfekjr.supabase.co";

const ADMIN_SUPABASE_PUBLISHABLE_KEY =
"sb_publishable_8YXsMHOxLr7MOTEYShUM3w_LsZvR3Qn";

let adminSupabaseClient;

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
document.getElementById("loginScreen");

const adminScreen =
document.getElementById("adminScreen");

const loginForm =
document.getElementById("loginForm");

const loginError =
document.getElementById("loginError");

const logoutButton =
document.getElementById("logoutButton");

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

    setupTrainingModal();


    await checkAuth();

}

);

/* ==================================================
Supabaseクライアント確認
================================================== */

function checkSupabaseClient() {

if (
    !adminSupabaseClient
) {

    throw new Error(
        "管理者用Supabaseクライアントが初期化されていません。"
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
認証状態確認
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

        console.log(
            "管理者ログインが必要です。"
        );


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


        loginError.textContent = "";


        const email =
            document
                .getElementById("email")
                .value
                .trim();


        const password =
            document
                .getElementById("password")
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


            console.log(
                "管理者ログイン開始"
            );


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


            console.log(
                "管理者ログイン成功"
            );


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

        const confirmed =
            confirm(
                "ログアウトしますか？"
            );


        if (!confirmed) {

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


await Promise.all([

    loadDashboard(),

    loadParticipants(),

    loadTrainings(),

    loadParticipations()

]);


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
                    count: "exact"
                }),


            adminSupabaseClient
                .from("trainings")
                .select("*", {
                    count: "exact"
                }),


            adminSupabaseClient
                .from("participations")
                .select("*", {
                    count: "exact"
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

    container.textContent =
        "まだ参加記録がありません。";

    return;

}


container.innerHTML = "";


data.forEach(item => {

    const div =
        document.createElement(
            "div"
        );


    div.className =
        "recent-item";


    div.textContent =
        `${formatDate(
            item.registered_at
        )}　参加者ID: ${
            item.participant_id
        }　訓練ID: ${
            item.training_id
        }`;


    container.appendChild(div);

});

}

/* ==================================================
参加者一覧
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

    const tr =
        document.createElement(
            "tr"
        );


    tr.innerHTML = `

        <td>
            ${escapeHtml(
                participant.participant_id
            )}
        </td>

        <td>
            ${escapeHtml(
                participant.name
            )}
        </td>

        <td>
            ${formatDate(
                participant.created_at
            )}
        </td>

        <td>

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
参加者モーダル
================================================== */

function setupParticipantModal() {

const cancelButton =
    document.getElementById(
        "cancelParticipantButton"
    );


const saveButton =
    document.getElementById(
        "saveParticipantButton"
    );


if (cancelButton) {

    cancelButton.addEventListener(
        "click",
        closeParticipantModal
    );

}


if (saveButton) {

    saveButton.addEventListener(
        "click",
        saveParticipant
    );

}

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
参加者保存
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

    await loadParticipants();

    await loadDashboard();


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

const confirmed =
    confirm(
        "この参加者を削除しますか？\n\n" +
        "この参加者の参加履歴も削除されます。"
    );


if (!confirmed) {

    return;

}


try {

    const {
        data: participant,
        error: participantError
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
        <td colspan="4">
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
            <td colspan="4">
                読み込みに失敗しました。
            </td>
        </tr>`;

    return;

}


tbody.innerHTML = "";


if (
    !data ||
    data.length === 0
) {

    tbody.innerHTML =
        `<tr>
            <td colspan="4">
                訓練・講座はありません。
            </td>
        </tr>`;

    return;

}


data.forEach(training => {

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
            ${escapeHtml(
                training.title
            )}
        </td>

        <td>
            ${formatDate(
                training.created_at
            )}
        </td>

        <td>

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
訓練モーダル
================================================== */

function setupTrainingModal() {

const addButton =
    document.getElementById(
        "addTrainingButton"
    );


const cancelButton =
    document.getElementById(
        "cancelTrainingButton"
    );


const saveButton =
    document.getElementById(
        "saveTrainingButton"
    );


if (addButton) {

    addButton.addEventListener(
        "click",
        () => {

            openTrainingModal();

        }
    );

}


if (cancelButton) {

    cancelButton.addEventListener(
        "click",
        closeTrainingModal
    );

}


if (saveButton) {

    saveButton.addEventListener(
        "click",
        saveTraining
    );

}

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

    await loadTrainings();

    await loadDashboard();


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

const confirmed =
    confirm(
        "この訓練・講座を削除しますか？\n\n" +
        "この訓練に紐づく参加履歴も削除されます。"
    );


if (!confirmed) {

    return;

}


try {

    const {
        data: training,
        error: trainingError
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

    const tr =
        document.createElement(
            "tr"
        );


    tr.innerHTML = `

        <td>
            ${escapeHtml(
                participation.participant_id
            )}
        </td>

        <td>
            ${escapeHtml(
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

const confirmed =
    confirm(
        "この参加履歴を削除しますか？"
    );


if (!confirmed) {

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
日付フォーマット
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
