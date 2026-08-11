const ADMIN_PASSWORD = "iwase-admin-2026";

document.addEventListener("DOMContentLoaded", function () {

const loginButton =
    document.getElementById("loginButton");

const logoutButton =
    document.getElementById("logoutButton");


if (loginButton) {

    loginButton.addEventListener(
        "click",
        adminLogin
    );

}


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        adminLogout
    );

}


checkAdminLogin();

});

function checkAdminLogin() {

const login =
    localStorage.getItem(
        "iwaseAdminLogin"
    );


if (login === "true") {

    showAdminArea();

} else {

    showLoginArea();

}

}

function adminLogin() {

const passwordElement =
    document.getElementById(
        "adminPassword"
    );

const errorElement =
    document.getElementById(
        "loginError"
    );


if (!passwordElement) {

    return;

}


const password =
    passwordElement.value;


if (password === ADMIN_PASSWORD) {

    localStorage.setItem(
        "iwaseAdminLogin",
        "true"
    );


    if (errorElement) {

        errorElement.textContent = "";

    }


    showAdminArea();

} else {

    if (errorElement) {

        errorElement.textContent =
            "パスワードが正しくありません。";

    }

}

}

function showAdminArea() {

const loginArea =
    document.getElementById(
        "loginArea"
    );

const adminArea =
    document.getElementById(
        "adminArea"
    );


if (loginArea) {

    loginArea.classList.add(
        "hidden"
    );

}


if (adminArea) {

    adminArea.classList.remove(
        "hidden"
    );

}


loadDashboard();

}

function showLoginArea() {

const loginArea =
    document.getElementById(
        "loginArea"
    );

const adminArea =
    document.getElementById(
        "adminArea"
    );


if (loginArea) {

    loginArea.classList.remove(
        "hidden"
    );

}


if (adminArea) {

    adminArea.classList.add(
        "hidden"
    );

}

}

function adminLogout() {

localStorage.removeItem(
    "iwaseAdminLogin"
);


location.reload();

}

async function loadDashboard() {

await loadParticipants();

await loadTrainings();

await loadParticipations();

}

/* =========================
利用者一覧
========================= */

async function loadParticipants() {

const table =
    document.getElementById(
        "participantsTable"
    );


if (!table) {

    return;

}


table.innerHTML =
    "<tr>" +
    "<td colspan=\"3\">" +
    "読み込み中..." +
    "</td>" +
    "</tr>";


try {

    const result =
        await supabaseClient
            .from("participants")
            .select("*");


    if (result.error) {

        throw result.error;

    }


    const data =
        result.data || [];


    const count =
        document.getElementById(
            "participantCount"
        );


    if (count) {

        count.textContent =
            data.length;

    }


    table.innerHTML = "";


    if (data.length === 0) {

        table.innerHTML =
            "<tr>" +
            "<td colspan=\"3\">" +
            "登録利用者はいません。" +
            "</td>" +
            "</tr>";

        return;

    }


    data.forEach(function (participant) {

        const row =
            document.createElement(
                "tr"
            );


        const id =
            participant.id || "";


        const name =
            participant.name ||
            participant.participant_name ||
            "";


        const registeredAt =
            participant.registered_at ||
            "";


        row.innerHTML =
            "<td>" +
            escapeHTML(id) +
            "</td>" +

            "<td>" +
            escapeHTML(name) +
            "</td>" +

            "<td>" +
            escapeHTML(registeredAt) +
            "</td>";


        table.appendChild(row);

    });


} catch (error) {

    console.error(
        "participants error:",
        error
    );


    table.innerHTML =
        "<tr>" +
        "<td colspan=\"3\">" +
        "利用者データの取得に失敗しました。" +
        "</td>" +
        "</tr>";

}

}

/* =========================
訓練一覧
========================= */

async function loadTrainings() {

const table =
    document.getElementById(
        "trainingsTable"
    );


if (!table) {

    return;

}


table.innerHTML =
    "<tr>" +
    "<td colspan=\"3\">" +
    "読み込み中..." +
    "</td>" +
    "</tr>";


try {

    const result =
        await supabaseClient
            .from("trainings")
            .select("*");


    if (result.error) {

        throw result.error;

    }


    const data =
        result.data || [];


    const count =
        document.getElementById(
            "trainingCount"
        );


    if (count) {

        count.textContent =
            data.length;

    }


    table.innerHTML = "";


    if (data.length === 0) {

        table.innerHTML =
            "<tr>" +
            "<td colspan=\"3\">" +
            "登録訓練はありません。" +
            "</td>" +
            "</tr>";

        return;

    }


    data.forEach(function (training) {

        const row =
            document.createElement(
                "tr"
            );


        const date =
            training.date ||
            "";


        const event =
            training.event ||
            training.title ||
            training.name ||
            "";


        const id =
            training.id ||
            "";


        row.innerHTML =
            "<td>" +
            escapeHTML(date) +
            "</td>" +

            "<td>" +
            escapeHTML(event) +
            "</td>" +

            "<td>" +
            escapeHTML(id) +
            "</td>";


        table.appendChild(row);

    });


} catch (error) {

    console.error(
        "trainings error:",
        error
    );


    table.innerHTML =
        "<tr>" +
        "<td colspan=\"3\">" +
        "訓練データの取得に失敗しました。" +
        "</td>" +
        "</tr>";

}

}

/* =========================
参加履歴
========================= */

async function loadParticipations() {

const table =
    document.getElementById(
        "participationsTable"
    );


if (!table) {

    return;

}


table.innerHTML =
    "<tr>" +
    "<td colspan=\"3\">" +
    "読み込み中..." +
    "</td>" +
    "</tr>";


try {

    const result =
        await supabaseClient
            .from("participations")
            .select("*");


    if (result.error) {

        throw result.error;

    }


    const data =
        result.data || [];


    const count =
        document.getElementById(
            "participationCount"
        );


    if (count) {

        count.textContent =
            data.length;

    }


    table.innerHTML = "";


    if (data.length === 0) {

        table.innerHTML =
            "<tr>" +
            "<td colspan=\"3\">" +
            "参加記録はありません。" +
            "</td>" +
            "</tr>";

        return;

    }


    data.forEach(function (participation) {

        const row =
            document.createElement(
                "tr"
            );


        const participantId =
            participation.participant_id ||
            participation.participant ||
            participation.user_id ||
            "";


        const trainingId =
            participation.training_id ||
            "";


        const participatedAt =
            participation.participated_at ||
            participation.registered_at ||
            participation.created_at ||
            "";


        row.innerHTML =
            "<td>" +
            escapeHTML(
                participantId
            ) +
            "</td>" +

            "<td>" +
            escapeHTML(
                trainingId
            ) +
            "</td>" +

            "<td>" +
            escapeHTML(
                participatedAt
            ) +
            "</td>";


        table.appendChild(row);

    });


} catch (error) {

    console.error(
        "participations error:",
        error
    );


    table.innerHTML =
        "<tr>" +
        "<td colspan=\"3\">" +
        "参加記録の取得に失敗しました。" +
        "</td>" +
        "</tr>";

}

}

/* =========================
HTMLエスケープ
========================= */

function escapeHTML(value) {

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
