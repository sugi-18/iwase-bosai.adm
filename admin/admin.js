/* ==================================================
いわぽん防災 管理者画面
Supabase Auth対応
================================================== */

/* ==================================================
Supabase確認
================================================== */

if (typeof supabase === "undefined") {

alert(
    "Supabaseが読み込まれていません。\n" +
    "supabase.jsの読み込みを確認してください。"
);

}

/* ==================================================
DOM
================================================== */

const loginScreen = document.getElementById("loginScreen");
const adminScreen = document.getElementById("adminScreen");

const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

const logoutButton = document.getElementById("logoutButton");

/* ==================================================
初期化
================================================== */

document.addEventListener("DOMContentLoaded", async () => {

setupNavigation();
setupParticipantModal();
setupTrainingModal();

await checkAuth();

});

/* ==================================================
認証確認
================================================== */

async function checkAuth() {

try {

    const {
        data,
        error
    } = await supabase.auth.getSession();


    if (error) {
        throw error;
    }


    if (data.session) {

        showAdminScreen();

        await loadAllData();

    } else {

        showLoginScreen();

    }

} catch (error) {

    console.error(error);

    showLoginScreen();

}

}

/* ==================================================
ログイン
================================================== */

loginForm.addEventListener("submit", async (event) => {

event.preventDefault();

loginError.textContent = "";


const email =
    document.getElementById("email").value.trim();

const password =
    document.getElementById("password").value;


try {

    const {
        data,
        error
    } = await supabase.auth.signInWithPassword({

        email,
        password

    });


    if (error) {
        throw error;
    }


    if (!data.session) {

        throw new Error(
            "ログインセッションを取得できませんでした。"
        );

    }


    showAdminScreen();

    await loadAllData();


} catch (error) {

    console.error(error);

    loginError.textContent =
        "ログインできませんでした。メールアドレスまたはパスワードを確認してください。";

}

});

/* ==================================================
ログアウト
================================================== */

logoutButton.addEventListener("click", async () => {

const confirmed =
    confirm("ログアウトしますか？");


if (!confirmed) {
    return;
}


const {
    error
} = await supabase.auth.signOut();


if (error) {

    alert(
        "ログアウトに失敗しました。\n" +
        error.message
    );

    return;

}


showLoginScreen();

});

/* ==================================================
表示切替
================================================== */

function showLoginScreen() {

loginScreen.classList.remove("hidden");
adminScreen.classList.add("hidden");

}

function showAdminScreen() {

loginScreen.classList.add("hidden");
adminScreen.classList.remove("hidden");

}

/* ==================================================
ナビゲーション
================================================== */

function setupNavigation() {

const buttons =
    document.querySelectorAll(".nav-button");


buttons.forEach(button => {

    button.addEventListener("click", () => {

        const target =
            button.dataset.target;


        document
            .querySelectorAll(".content-section")
            .forEach(section => {

                section.classList.add("hidden");

            });


        document
            .getElementById(target)
            .classList.remove("hidden");


        buttons.forEach(item => {

            item.classList.remove("active");

        });


        button.classList.add("active");

    });

});

}

/* ==================================================
全データ読み込み
================================================== */

async function loadAllData() {

await Promise.all([

    loadDashboard(),

    loadParticipants(),

    loadTrainings(),

    loadParticipations()

]);

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
    ] = await Promise.all([

        supabase
            .from("participants")
            .select("*", {
                count: "exact",
                head: false
            }),

        supabase
            .from("trainings")
            .select("*", {
                count: "exact",
                head: false
            }),

        supabase
            .from("participations")
            .select("*", {
                count: "exact",
                head: false
            })

    ]);


    if (participantsResult.error) {
        throw participantsResult.error;
    }


    if (trainingsResult.error) {
        throw trainingsResult.error;
    }


    if (participationsResult.error) {
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


const {
    data,
    error
} = await supabase
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


if (!data || data.length === 0) {

    container.textContent =
        "まだ参加記録がありません。";

    return;

}


container.innerHTML = "";


data.forEach(item => {

    const div =
        document.createElement("div");

    div.className =
        "recent-item";


    div.textContent =
        `${formatDate(item.registered_at)}
        　参加者ID: ${item.participant_id}
        　訓練ID: ${item.training_id}`;


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


tbody.innerHTML =
    `<tr><td colspan="4">読み込み中...</td></tr>`;


const {
    data,
    error
} = await supabase
    .from("participants")
    .select("*")
    .order(
        "created_at",
        {
            ascending: false
        }
    );


if (error) {

    console.error(error);

    tbody.innerHTML =
        `<tr>
            <td colspan="4">
                読み込みに失敗しました。
            </td>
        </tr>`;

    return;

}


tbody.innerHTML = "";


if (!data || data.length === 0) {

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
        document.createElement("tr");


    tr.innerHTML = `

        <td>
            ${escapeHtml(participant.participant_id)}
        </td>

        <td>
            ${escapeHtml(participant.name)}
        </td>

        <td>
            ${formatDate(participant.created_at)}
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
                            item.id === button.dataset.id
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
    .addEventListener(
        "click",
        closeParticipantModal
    );


document
    .getElementById(
        "saveParticipantButton"
    )
    .addEventListener(
        "click",
        saveParticipant
    );

}

function openParticipantModal(participant) {

document
    .getElementById(
        "editParticipantDbId"
    )
    .value =
    participant.id;


document
    .getElementById(
        "editParticipantId"
    )
    .value =
    participant.participant_id;


document
    .getElementById(
        "editParticipantName"
    )
    .value =
    participant.name || "";


document
    .getElementById(
        "participantModal"
    )
    .classList.remove("hidden");

}

function closeParticipantModal() {

document
    .getElementById(
        "participantModal"
    )
    .classList.add("hidden");

}

async function saveParticipant() {

const id =
    document
        .getElementById(
            "editParticipantDbId"
        )
        .value;


const name =
    document
        .getElementById(
            "editParticipantName"
        )
        .value
        .trim();


if (!name) {

    alert("名前を入力してください。");

    return;

}


const {
    error
} = await supabase
    .from("participants")
    .update({
        name
    })
    .eq("id", id);


if (error) {

    console.error(error);

    alert(
        "保存に失敗しました。\n" +
        error.message
    );

    return;

}


closeParticipantModal();

await loadParticipants();

await loadDashboard();


alert("参加者情報を更新しました。");

}

/* ==================================================
参加者削除
================================================== */

async function deleteParticipant(id) {

const confirmed =
    confirm(
        "この参加者を削除しますか？\n\n" +
        "参加履歴も削除する必要があります。"
    );


if (!confirmed) {
    return;
}


const {
    data: participant,
    error: participantError
} = await supabase
    .from("participants")
    .select("participant_id")
    .eq("id", id)
    .single();


if (participantError) {

    alert(
        "参加者情報を取得できませんでした。"
    );

    return;

}


const participantId =
    participant.participant_id;


const {
    error: participationError
} = await supabase
    .from("participations")
    .delete()
    .eq(
        "participant_id",
        participantId
    );


if (participationError) {

    console.error(
        participationError
    );

    alert(
        "参加履歴の削除に失敗しました。\n" +
        participationError.message
    );

    return;

}


const {
    error
} = await supabase
    .from("participants")
    .delete()
    .eq("id", id);


if (error) {

    console.error(error);

    alert(
        "参加者の削除に失敗しました。\n" +
        error.message
    );

    return;

}


await loadAllData();


alert("参加者を削除しました。");

}

/* ==================================================
訓練一覧
================================================== */

async function loadTrainings() {

const tbody =
    document.getElementById(
        "trainingsTable"
    );


tbody.innerHTML =
    `<tr><td colspan="4">読み込み中...</td></tr>`;


const {
    data,
    error
} = await supabase
    .from("trainings")
    .select("*")
    .order(
        "created_at",
        {
            ascending: false
        }
    );


if (error) {

    console.error(error);

    tbody.innerHTML =
        `<tr>
            <td colspan="4">
                読み込みに失敗しました。
            </td>
        </tr>`;

    return;

}


tbody.innerHTML = "";


if (!data || data.length === 0) {

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
        document.createElement("tr");


    tr.innerHTML = `

        <td>
            ${escapeHtml(training.training_id)}
        </td>

        <td>
            ${escapeHtml(training.title)}
        </td>

        <td>
            ${formatDate(training.created_at)}
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
                            item.id === button.dataset.id
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

document
    .getElementById(
        "addTrainingButton"
    )
    .addEventListener(
        "click",
        () => {

            openTrainingModal();

        }
    );


document
    .getElementById(
        "cancelTrainingButton"
    )
    .addEventListener(
        "click",
        closeTrainingModal
    );


document
    .getElementById(
        "saveTrainingButton"
    )
    .addEventListener(
        "click",
        saveTraining
    );

}

function openTrainingModal(training = null) {

document
    .getElementById(
        "editTrainingDbId"
    )
    .value =
    training?.id || "";


document
    .getElementById(
        "editTrainingId"
    )
    .value =
    training?.training_id || "";


document
    .getElementById(
        "editTrainingTitle"
    )
    .value =
    training?.title || "";


document
    .getElementById(
        "trainingModalTitle"
    )
    .textContent =
    training
        ? "訓練・講座を編集"
        : "訓練・講座を登録";


document
    .getElementById(
        "trainingModal"
    )
    .classList.remove("hidden");

}

function closeTrainingModal() {

document
    .getElementById(
        "trainingModal"
    )
    .classList.add("hidden");

}

async function saveTraining() {

const id =
    document
        .getElementById(
            "editTrainingDbId"
        )
        .value;


const trainingId =
    document
        .getElementById(
            "editTrainingId"
        )
        .value
        .trim();


const title =
    document
        .getElementById(
            "editTrainingTitle"
        )
        .value
        .trim();


if (!trainingId) {

    alert("訓練IDを入力してください。");

    return;

}


if (!title) {

    alert("タイトルを入力してください。");

    return;

}


let result;


if (id) {

    result =
        await supabase
            .from("trainings")
            .update({
                training_id: trainingId,
                title
            })
            .eq("id", id);

} else {

    result =
        await supabase
            .from("trainings")
            .insert({

                training_id:
                    trainingId,

                title

            });

}


if (result.error) {

    console.error(result.error);

    alert(
        "保存に失敗しました。\n" +
        result.error.message
    );

    return;

}


closeTrainingModal();

await loadTrainings();

await loadDashboard();


alert(
    id
        ? "訓練情報を更新しました。"
        : "訓練を登録しました。"
);

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


const {
    data: training,
    error: trainingError
} = await supabase
    .from("trainings")
    .select("training_id")
    .eq("id", id)
    .single();


if (trainingError) {

    alert(
        "訓練情報を取得できませんでした。"
    );

    return;

}


const trainingId =
    training.training_id;


const {
    error: participationError
} = await supabase
    .from("participations")
    .delete()
    .eq(
        "training_id",
        trainingId
    );


if (participationError) {

    console.error(
        participationError
    );

    alert(
        "参加履歴の削除に失敗しました。\n" +
        participationError.message
    );

    return;

}


const {
    error
} = await supabase
    .from("trainings")
    .delete()
    .eq("id", id);


if (error) {

    console.error(error);

    alert(
        "訓練の削除に失敗しました。\n" +
        error.message
    );

    return;

}


await loadAllData();


alert("訓練を削除しました。");

}

/* ==================================================
参加履歴
================================================== */

async function loadParticipations() {

const tbody =
    document.getElementById(
        "participationsTable"
    );


tbody.innerHTML =
    `<tr><td colspan="4">読み込み中...</td></tr>`;


const {
    data,
    error
} = await supabase
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

    console.error(error);

    tbody.innerHTML =
        `<tr>
            <td colspan="4">
                読み込みに失敗しました。
            </td>
        </tr>`;

    return;

}


tbody.innerHTML = "";


if (!data || data.length === 0) {

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
        document.createElement("tr");


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


const {
    error
} = await supabase
    .from("participations")
    .delete()
    .eq("id", id);


if (error) {

    console.error(error);

    alert(
        "削除に失敗しました。\n" +
        error.message
    );

    return;

}


await loadParticipations();

await loadDashboard();


alert("参加履歴を削除しました。");

}

/* ==================================================
日付表示
================================================== */

function formatDate(value) {

if (!value) {
    return "-";
}


const date =
    new Date(value);


if (Number.isNaN(date.getTime())) {
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

if (value === null || value === undefined) {
    return "";
}


return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}
