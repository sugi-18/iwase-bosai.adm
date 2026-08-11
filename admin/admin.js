/* ========================
岩瀬自治会 防災アプリ
管理者画面
======================== */

/* ========================
管理者パスワード
======================== */

const ADMIN_PASSWORD = "admin";

/* ========================
初期処理
======================== */

document.addEventListener("DOMContentLoaded", function () {

```
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
```

});

/* ========================
管理者ログイン確認
======================== */

function checkAdminLogin() {

```
const login =
    localStorage.getItem(
        "iwaseAdminLogin"
    );


if (login === "true") {

    showAdminArea();

} else {

    showLoginArea();

}
```

}

/* ========================
ログイン
======================== */

function adminLogin() {

```
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
```

}

/* ========================
管理画面表示
======================== */

function showAdminArea() {

```
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
```

}

/* ========================
ログイン画面表示
======================== */

function showLoginArea() {

```
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
```

}

/* ========================
ログアウト
======================== */

function adminLogout() {

```
localStorage.removeItem(
    "iwaseAdminLogin"
);


location.reload();
```

}

/* ========================
ダッシュボード
======================== */

async function loadDashboard() {

```
await loadParticipants();

await loadTrainings();

await loadParticipations();
```

}

/* ========================
利用者一覧
======================== */

async function loadParticipants() {

```
const table =
    document.getElementById(
        "participantsTable"
    );


if (!table) {

    return;

}


table.innerHTML = `
    <tr>
        <td colspan="3">
            読み込み中...
        </td>
    </tr>
`;


try {

    const result =
        await supabaseClient
            .from("participants")
            .select("*")
            .order(
                "registered_at",
                {
                    ascending: false
                }
            );


    const data = result.data;

    const error = result.error;


    if (error) {

        throw error;

    }


    const countElement =
        document.getElementById(
            "participantCount"
        );


    if (countElement) {

        countElement.textContent =
            data.length;

    }


    if (data.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="3">
                    登録利用者はいません。
                </td>
            </tr>
        `;

        return;

    }


    table.innerHTML = "";


    data.forEach(function (participant) {

        const row =
            document.createElement(
                "tr"
            );


        row.innerHTML = `
            <td>
                ${escapeHTML(
                    participant.id
                )}
            </td>

            <td>
                ${escapeHTML(
                    participant.name || ""
                )}
            </td>

            <td>
                ${formatDate(
                    participant.registered_at
                )}
            </td>
        `;


        table.appendChild(row);

    });


} catch (error) {

    console.error(
        "participants error:",
        error
    );


    table.innerHTML = `
        <tr>
            <td colspan="3">
                利用者データの取得に失敗しました。
            </td>
        </tr>
    `;

}
```

}

/* ========================
訓練一覧
======================== */

async function loadTrainings() {

```
const table =
    document.getElementById(
        "trainingsTable"
    );


if (!table) {

    return;

}


table.innerHTML = `
    <tr>
        <td colspan="3">
            読み込み中...
        </td>
    </tr>
`;


try {

    const result =
        await supabaseClient
            .from("trainings")
            .select("*")
            .order(
                "date",
                {
                    ascending: false
                }
            );


    const data = result.data;

    const error = result.error;


    if (error) {

        throw error;

    }


    const countElement =
        document.getElementById(
            "trainingCount"
        );


    if (countElement) {

        countElement.textContent =
            data.length;

    }


    if (data.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="3">
                    登録訓練はありません。
                </td>
            </tr>
        `;

        return;

    }


    table.innerHTML = "";


    data.forEach(function (training) {

        const row =
            document.createElement(
                "tr"
            );


        row.innerHTML = `
            <td>
                ${escapeHTML(
                    training.date || ""
                )}
            </td>

            <td>
                ${escapeHTML(
                    training.event || ""
                )}
            </td>

            <td>
                ${escapeHTML(
                    training.id || ""
                )}
            </td>
        `;


        table.appendChild(row);

    });


} catch (error) {

    console.error(
        "trainings error:",
        error
    );


    table.innerHTML = `
        <tr>
            <td colspan="3">
                訓練データの取得に失敗しました。
            </td>
        </tr>
    `;

}
```

}

/* ========================
参加履歴
======================== */

async function loadParticipations() {

```
const table =
    document.getElementById(
        "participationsTable"
    );


if (!table) {

    return;

}


table.innerHTML = `
    <tr>
        <td colspan="3">
            読み込み中...
        </td>
    </tr>
`;


try {

    const result =
        await supabaseClient
            .from("participations")
            .select("*");


    const data = result.data;

    const error = result.error;


    if (error) {

        throw error;

    }


    const countElement =
        document.getElementById(
            "participationCount"
        );


    if (countElement) {

        countElement.textContent =
            data.length;

    }


    if (data.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="3">
                    参加記録はありません。
                </td>
            </tr>
        `;

        return;

    }


    table.innerHTML = "";


    data.forEach(function (participation) {

        const row =
            document.createElement(
                "tr"
            );


        const participantId =
            participation.participant_id ||
            participation.participant ||
            "";


        const trainingId =
            participation.training_id ||
            "";


        const participatedAt =
            participation.participated_at ||
            participation.created_at ||
            "";


        row.innerHTML = `
            <td>
                ${escapeHTML(
                    participantId
                )}
            </td>

            <td>
                ${escapeHTML(
                    trainingId
                )}
            </td>

            <td>
                ${escapeHTML(
                    participatedAt
                )}
            </td>
        `;


        table.appendChild(row);

    });


} catch (error) {

    console.error(
        "participations error:",
        error
    );


    table.innerHTML = `
        <tr>
            <td colspan="3">
                参加履歴の取得に失敗しました。
            </td>
        </tr>
    `;

}
```

}

/* ========================
日付表示
======================== */

function formatDate(value) {

```
if (!value) {

    return "";

}


const date =
    new Date(value);


if (
    Number.isNaN(
        date.getTime()
    )
) {

    return String(value);

}


return date.toLocaleString(
    "ja-JP"
);
```

}

/* ========================
HTMLエスケープ
======================== */

function escapeHTML(value) {

```
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
```

}
