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

let monthlyChart = null;


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

        setupNavigation();

        setupParticipantModal();

        setupParticipantHistoryModal();

        setupTrainingModal();

        setupTrainingParticipantsModal();


        document
            .getElementById(
                "refreshDashboardButton"
            )
            ?.addEventListener(
                "click",
                async () => {

                    await loadDashboard();

                }
            );


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


            try {

                checkSupabaseClient();


                const {
                    data,
                    error
                } =
                    await adminSupabaseClient
                        .auth
                        .signInWithPassword({

                            email,

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

                if (
                    session &&
                    event !== "SIGNED_OUT"
                ) {

                    showAdminScreen();

                }


                if (
                    !session ||
                    event === "SIGNED_OUT"
                ) {

                    showLoginScreen();

                }

            }
        );

}


/* ==================================================
   画面
================================================== */

function showLoginScreen() {

    loginScreen?.classList.remove(
        "hidden"
    );

    adminScreen?.classList.add(
        "hidden"
    );

}


function showAdminScreen() {

    loginScreen?.classList.add(
        "hidden"
    );

    adminScreen?.classList.remove(
        "hidden"
    );

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


                document
                    .getElementById(
                        target
                    )
                    ?.classList.remove(
                        "hidden"
                    );


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
   全データ
================================================== */

async function loadAllData() {

    try {

        await loadParticipants();

        await loadTrainings();

        await loadParticipations();

        await loadDashboard();

    } catch (error) {

        console.error(
            "Load all data error:",
            error
        );

    }

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
                    .select("*"),

                adminSupabaseClient
                    .from("trainings")
                    .select("*"),

                adminSupabaseClient
                    .from("participations")
                    .select("*")

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


        const participants =
            participantsResult.data || [];


        const trainings =
            trainingsResult.data || [];


        const participations =
            participationsResult.data || [];


        /* ------------------------------------------
           基本統計
        ------------------------------------------ */

        const participantCount =
            participants.length;


        const trainingCount =
            trainings.length;


        const participationCount =
            participations.length;


        const activeParticipantIds =
            new Set(
                participations
                    .map(
                        item =>
                            item.participant_id
                    )
                    .filter(Boolean)
            );


        const activeParticipantCount =
            activeParticipantIds.size;


        const averageParticipation =
            activeParticipantCount > 0
                ? (
                    participationCount /
                    activeParticipantCount
                ).toFixed(1)
                : "0";


        setText(
            "participantCount",
            participantCount
        );


        setText(
            "activeParticipantCount",
            activeParticipantCount
        );


        setText(
            "trainingCount",
            trainingCount
        );


        setText(
            "participationCount",
            participationCount
        );


        setText(
            "averageParticipation",
            averageParticipation
        );


        /* ------------------------------------------
           今月
        ------------------------------------------ */

        const now =
            new Date();


        const currentYear =
            now.getFullYear();


        const currentMonth =
            now.getMonth();


        const monthlyParticipations =
            participations.filter(
                item => {

                    if (
                        !item.registered_at
                    ) {

                        return false;

                    }


                    const date =
                        new Date(
                            item.registered_at
                        );


                    return (
                        date.getFullYear() ===
                            currentYear &&
                        date.getMonth() ===
                            currentMonth
                    );

                }
            );


        const monthlyParticipantIds =
            new Set(
                monthlyParticipations
                    .map(
                        item =>
                            item.participant_id
                    )
                    .filter(Boolean)
            );


        setText(
            "monthlyParticipantCount",
            monthlyParticipantIds.size
        );


        setText(
            "monthlyParticipationCount",
            monthlyParticipations.length
        );


        /* ------------------------------------------
           訓練ランキング
        ------------------------------------------ */

        const trainingCounts =
            {};


        participations.forEach(item => {

            if (
                !item.training_id
            ) {

                return;

            }


            trainingCounts[
                item.training_id
            ] =
                (
                    trainingCounts[
                        item.training_id
                    ] || 0
                ) + 1;

        });


        const trainingRanking =
            trainings
                .map(training => ({

                    training,

                    count:
                        trainingCounts[
                            training.training_id
                        ] || 0

                }))
                .sort(
                    (a, b) =>
                        b.count - a.count
                );


        const popularTraining =
            trainingRanking[0];


        setText(
            "mostPopularTraining",
            popularTraining &&
            popularTraining.count > 0
                ? `${popularTraining.training.title}（${popularTraining.count}人）`
                : "-"
        );


        /* ------------------------------------------
           グラフ
        ------------------------------------------ */

        createMonthlyChart(
            participations
        );


        /* ------------------------------------------
           参加者ランキング
        ------------------------------------------ */

        createParticipantRanking(
            participants,
            participations
        );


        /* ------------------------------------------
           訓練ランキング
        ------------------------------------------ */

        createTrainingRanking(
            trainingRanking
        );


        /* ------------------------------------------
           最近の参加
        ------------------------------------------ */

        createRecentParticipations(
            participations,
            participants,
            trainings
        );


    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

    }

}


/* ==================================================
   月別グラフ
================================================== */

function createMonthlyChart(
    participations
) {

    const canvas =
        document.getElementById(
            "monthlyParticipationChart"
        );


    if (!canvas) {

        return;

    }


    if (
        typeof Chart ===
        "undefined"
    ) {

        console.error(
            "Chart.jsが読み込まれていません。"
        );

        return;

    }


    const now =
        new Date();


    const labels = [];

    const values = [];


    for (
        let i = 5;
        i >= 0;
        i--
    ) {

        const date =
            new Date(
                now.getFullYear(),
                now.getMonth() - i,
                1
            );


        const year =
            date.getFullYear();


        const month =
            date.getMonth();


        labels.push(
            `${month + 1}月`
        );


        const count =
            participations.filter(
                item => {

                    if (
                        !item.registered_at
                    ) {

                        return false;

                    }


                    const registered =
                        new Date(
                            item.registered_at
                        );


                    return (
                        registered.getFullYear() ===
                            year &&
                        registered.getMonth() ===
                            month
                    );

                }
            ).length;


        values.push(
            count
        );

    }


    if (
        monthlyChart
    ) {

        monthlyChart.destroy();

    }


    monthlyChart =
        new Chart(
            canvas,
            {

                type: "bar",

                data: {

                    labels,

                    datasets: [

                        {

                            label:
                                "延べ参加回数",

                            data:
                                values,

                            borderWidth:
                                1

                        }

                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    plugins: {

                        legend: {

                            display:
                                false

                        }

                    },

                    scales: {

                        y: {

                            beginAtZero:
                                true,

                            ticks: {

                                precision:
                                    0

                            }

                        }

                    }

                }

            }
        );

}


/* ==================================================
   参加者ランキング
================================================== */

function createParticipantRanking(
    participants,
    participations
) {

    const container =
        document.getElementById(
            "participationRanking"
        );


    if (!container) {

        return;

    }


    const counts =
        {};


    participations.forEach(item => {

        if (
            item.participant_id
        ) {

            counts[
                item.participant_id
            ] =
                (
                    counts[
                        item.participant_id
                    ] || 0
                ) + 1;

        }

    });


    const ranking =
        participants
            .map(participant => ({

                participant,

                count:
                    counts[
                        participant.participant_id
                    ] || 0

            }))
            .filter(
                item =>
                    item.count > 0
            )
            .sort(
                (a, b) =>
                    b.count - a.count
            )
            .slice(
                0,
                5
            );


    if (
        ranking.length === 0
    ) {

        container.innerHTML =
            `<div class="empty-message">
                まだ参加記録がありません。
            </div>`;

        return;

    }


    container.innerHTML =
        "";


    ranking.forEach(
        (item, index) => {

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "ranking-item";


            div.innerHTML = `

                <div class="ranking-number">
                    ${index + 1}
                </div>

                <div class="ranking-name">
                    ${escapeHtml(
                        item.participant.name ||
                        "名前未登録"
                    )}
                </div>

                <div class="ranking-value">
                    ${item.count}回
                </div>

            `;


            container.appendChild(
                div
            );

        }
    );

}


/* ==================================================
   訓練ランキング
================================================== */

function createTrainingRanking(
    ranking
) {

    const container =
        document.getElementById(
            "trainingRanking"
        );


    if (!container) {

        return;

    }


    const top =
        ranking
            .filter(
                item =>
                    item.count > 0
            )
            .slice(
                0,
                5
            );


    if (
        top.length === 0
    ) {

        container.innerHTML =
            `<div class="empty-message">
                まだ参加記録がありません。
            </div>`;

        return;

    }


    container.innerHTML =
        "";


    top.forEach(
        (item, index) => {

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "ranking-item";


            div.innerHTML = `

                <div class="ranking-number">
                    ${index + 1}
                </div>

                <div class="ranking-name">
                    ${escapeHtml(
                        item.training.title
                    )}
                </div>

                <div class="ranking-value">
                    ${item.count}人
                </div>

            `;


            container.appendChild(
                div
            );

        }
    );

}


/* ==================================================
   最近の参加
================================================== */

function createRecentParticipations(
    participations,
    participants,
    trainings
) {

    const container =
        document.getElementById(
            "recentParticipations"
        );


    if (!container) {

        return;

    }


    const recent =
        [...participations]
            .sort(
                (a, b) =>
                    new Date(
                        b.registered_at
                    ) -
                    new Date(
                        a.registered_at
                    )
            )
            .slice(
                0,
                10
            );


    if (
        recent.length === 0
    ) {

        container.innerHTML =
            `<div class="empty-message">
                まだ参加記録がありません。
            </div>`;

        return;

    }


    container.innerHTML =
        "";


    recent.forEach(item => {

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
            `${participant?.name || "名前未登録"}　` +
            `${training?.title || item.training_id}　` +
            `${formatDate(
                item.registered_at
            )}`;


        container.appendChild(
            div
        );

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
            "Participants loading error:",
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
        error: participationError
    } =
        await adminSupabaseClient
            .from("participations")
            .select(
                "participant_id"
            );


    if (participationError) {

        console.error(
            "Participation loading error:",
            participationError
        );

    }


    const list =
        participations || [];


    tbody.innerHTML =
        "";


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


    data.forEach(
        participant => {

            const count =
                list.filter(
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
                        type="button"
                        class="action-button view-button"
                        data-action="participant-history"
                        data-id="${escapeHtml(
                            participant.id
                        )}"
                    >
                        参加履歴
                    </button>

                    <button
                        type="button"
                        class="action-button edit-button"
                        data-action="edit-participant"
                        data-id="${escapeHtml(
                            participant.id
                        )}"
                    >
                        編集
                    </button>

                    <button
                        type="button"
                        class="action-button delete-button"
                        data-action="delete-participant"
                        data-id="${escapeHtml(
                            participant.id
                        )}"
                    >
                        削除
                    </button>

                </td>

            `;


            tbody.appendChild(
                tr
            );

        }
    );


    /* ------------------------------------------
       参加履歴
       participant-card.js が
       「参加者カルテ」に変更します
    ------------------------------------------ */

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


    /* ------------------------------------------
       編集
    ------------------------------------------ */

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


    /* ------------------------------------------
       削除
    ------------------------------------------ */

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
   参加者編集モーダル
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


    const {
        error
    } =
        await adminSupabaseClient
            .from("participants")
            .update({
                name
            })
            .eq(
                "id",
                id
            );


    if (error) {

        alert(
            "保存に失敗しました。\n" +
            error.message
        );

        return;

    }


    closeParticipantModal();

    await loadAllData();

}


/* ==================================================
   参加者削除
================================================== */

async function deleteParticipant(
    id
) {

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
            error
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


        if (error) {

            throw error;

        }


        await adminSupabaseClient
            .from("participations")
            .delete()
            .eq(
                "participant_id",
                participant.participant_id
            );


        const result =
            await adminSupabaseClient
                .from("participants")
                .delete()
                .eq(
                    "id",
                    id
                );


        if (result.error) {

            throw result.error;

        }


        await loadAllData();


    } catch (error) {

        alert(
            "削除に失敗しました。\n" +
            error.message
        );

    }

}


/* ==================================================
   参加者履歴モーダル
================================================== */

function setupParticipantHistoryModal() {

    document
        .getElementById(
            "closeParticipantHistoryButton"
        )
        ?.addEventListener(
            "click",
            () => {

                document
                    .getElementById(
                        "participantHistoryModal"
                    )
                    .classList.add(
                        "hidden"
                    );

            }
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

        content.innerHTML =
            "読み込みに失敗しました。";

        return;

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
        data: trainings
    } =
        await adminSupabaseClient
            .from("trainings")
            .select(
                "training_id, title"
            );


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
            trainings?.find(
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
            >
                削除
            </button>

        `;


        div
            .querySelector(
                "button"
            )
            .addEventListener(
                "click",
                async () => {

                    const deleted =
                        await deleteParticipation(
                            item.id
                        );


                    if (deleted) {

                        openParticipantHistory(
                            participant
                        );

                    }

                }
            );


        list.appendChild(
            div
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


    if (
        !trainingId ||
        !title
    ) {

        alert(
            "訓練IDとタイトルを入力してください。"
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

                        title

                    });

        }


        if (result.error) {

            throw result.error;

        }


        closeTrainingModal();

        await loadAllData();


    } catch (error) {

        alert(
            "保存に失敗しました。\n" +
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
            "Trainings loading error:",
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
        data: participations
    } =
        await adminSupabaseClient
            .from("participations")
            .select(
                "training_id"
            );


    tbody.innerHTML =
        "";


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
            (participations || [])
                .filter(
                    item =>
                        item.training_id ===
                        training.training_id
                )
                .length;


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
                    type="button"
                    class="action-button view-button"
                >
                    参加者を見る
                </button>

                <button
                    type="button"
                    class="action-button edit-button"
                >
                    編集
                </button>

                <button
                    type="button"
                    class="action-button delete-button"
                >
                    削除
                </button>

            </td>

        `;


        const buttons =
            tr.querySelectorAll(
                "button"
            );


        buttons[0]
            .addEventListener(
                "click",
                () => {

                    openTrainingParticipants(
                        training
                    );

                }
            );


        buttons[1]
            .addEventListener(
                "click",
                () => {

                    openTrainingModal(
                        training
                    );

                }
            );


        buttons[2]
            .addEventListener(
                "click",
                () => {

                    deleteTraining(
                        training.id
                    );

                }
            );


        tbody.appendChild(
            tr
        );

    });

}


/* ==================================================
   訓練参加者モーダル
================================================== */

function setupTrainingParticipantsModal() {

    document
        .getElementById(
            "closeTrainingParticipantsButton"
        )
        ?.addEventListener(
            "click",
            () => {

                document
                    .getElementById(
                        "trainingParticipantsModal"
                    )
                    .classList.add(
                        "hidden"
                    );

            }
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

        content.innerHTML =
            "読み込みに失敗しました。";

        return;

    }


    const {
        data: participants
    } =
        await adminSupabaseClient
            .from("participants")
            .select(
                "participant_id, name"
            );


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
            participants?.find(
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
                    ${formatDate(
                        item.registered_at
                    )}
                </div>

            </div>

            <button
                type="button"
                class="action-button delete-button"
            >
                削除
            </button>

        `;


        div
            .querySelector(
                "button"
            )
            .addEventListener(
                "click",
                async () => {

                    const deleted =
                        await deleteParticipation(
                            item.id
                        );


                    if (deleted) {

                        openTrainingParticipants(
                            training
                        );

                    }

                }
            );


        list.appendChild(
            div
        );

    });

}


/* ==================================================
   訓練削除
================================================== */

async function deleteTraining(
    id
) {

    if (
        !confirm(
            "この訓練・講座を削除しますか？\n\n" +
            "この訓練の参加履歴も削除されます。"
        )
    ) {

        return;

    }


    try {

        const {
            data: training,
            error
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


        if (error) {

            throw error;

        }


        await adminSupabaseClient
            .from("participations")
            .delete()
            .eq(
                "training_id",
                training.training_id
            );


        const result =
            await adminSupabaseClient
                .from("trainings")
                .delete()
                .eq(
                    "id",
                    id
                );


        if (result.error) {

            throw result.error;

        }


        await loadAllData();


    } catch (error) {

        alert(
            "削除に失敗しました。\n" +
            error.message
        );

    }

}


/* ==================================================
   参加履歴
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
            "Participations loading error:",
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


    tbody.innerHTML =
        "";


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
                    item.training_id
                )}
            </td>

            <td>
                ${formatDate(
                    item.registered_at
                )}
            </td>

            <td>

                <button
                    type="button"
                    class="action-button delete-button"
                >
                    削除
                </button>

            </td>

        `;


        tr
            .querySelector(
                "button"
            )
            .addEventListener(
                "click",
                () => {

                    deleteParticipation(
                        item.id
                    );

                }
            );


        tbody.appendChild(
            tr
        );

    });

}


/* ==================================================
   参加履歴削除
================================================== */

async function deleteParticipation(
    id
) {

    if (
        !confirm(
            "この参加履歴を削除しますか？"
        )
    ) {

        return false;

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


        await loadAllData();


        return true;


    } catch (error) {

        alert(
            "削除に失敗しました。\n" +
            error.message
        );


        return false;

    }

}


/* ==================================================
   共通：テキスト設定
================================================== */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


/* ==================================================
   共通：日付
================================================== */

function formatDate(
    value
) {

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
   共通：HTMLエスケープ
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
