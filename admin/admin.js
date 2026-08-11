/* ========================
管理者画面
======================== */

/*
管理者パスワード

```
※ここだけ変更してください。
```

*/

const ADMIN_PASSWORD = "admin";

/*
HTML読み込み完了
*/

document.addEventListener(
"DOMContentLoaded",
() => {

```
    checkAdminLogin();

    document
        .getElementById("loginButton")
        .addEventListener(
            "click",
            adminLogin
        );

    document
        .getElementById("logoutButton")
        .addEventListener(
            "click",
            adminLogout
        );

}
```

);

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
const password =
    document
        .getElementById(
            "adminPassword"
        )
        .value;


const error =
    document
        .getElementById(
            "loginError"
        );


if (
    password ===
    ADMIN_PASSWORD
) {

    localStorage.setItem(
        "iwaseAdminLogin",
        "true"
    );

    error.textContent = "";

    showAdminArea();

} else {

    error.textContent =
        "パスワードが正しくありません。";

}
```

}

/* ========================
管理画面表示
======================== */

function showAdminArea() {

```
document
    .getElementById(
        "loginArea"
    )
    .classList
    .add("hidden");


document
    .getElementById(
        "adminArea"
    )
    .classList
    .remove("hidden");


loadDashboard();
```

}

/* ========================
ログイン画面表示
======================== */

function showLoginArea() {

```
document
    .getElementById(
        "loginArea"
    )
    .classList
    .remove("hidden");


document
    .getElementById(
        "adminArea"
    )
    .classList
    .add("hidden");
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
利用者
======================== */

async function loadParticipants() {

```
const table =
    document.getElementById(
        "participantsTable"
    );


table.innerHTML =
    `
    <tr>
        <td colspan="3">
            読み込み中...
        </td>
    </tr>
    `;


try {

    const {
        data,
        error
    } = await supabaseClient
        .from("participants")
        .select("*")
        .order(
            "registered_at",
            {
                ascending: false
            }
        );


    if (error) {

        throw error;

    }


    document
        .getElementById(
            "participantCount"
        )
        .textContent =
            data.length;


    if (
        data.length === 0
    ) {

        table.innerHTML =
            `
            <tr>
                <td colspan="3">
                    登録利用者はいません。
                </td>
            </tr>
            `;

        return;

    }


    table.innerHTML =
        "";


    data.forEach(
        participant => {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML =
                `
                <td>
                    ${escapeHTML(
                        participant.id
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        participant.name
                        ?? ""
                    )}
                </td>

                <td>
                    ${formatDate(
                        participant.registered_at
                    )}
                </td>
                `;


            table.appendChild(
                row
            );

        }
    );


} catch (error) {

    console.error(
        "participants error:",
        error
    );


    table.innerHTML =
        `
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
訓練
======================== */

async function loadTrainings() {

```
const table =
    document.getElementById(
        "trainingsTable"
    );


table.innerHTML =
    `
    <tr>
        <td colspan="3">
            読み込み中...
        </td>
    </tr>
    `;


try {

    const {
        data,
        error
    } = await supabaseClient
        .from("trainings")
        .select("*")
        .order(
            "date",
            {
                ascending: false
            }
        );


    if (error) {

        throw error;

    }


    document
        .getElementById(
            "trainingCount"
        )
        .textContent =
            data.length;


    if (
        data.length === 0
    ) {

        table.innerHTML =
            `
            <tr>
                <td colspan="3">
                    登録訓練はありません。
                </td>
            </tr>
            `;

        return;

    }


    table.innerHTML =
        "";


    data.forEach(
        training => {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML =
                `
                <td>
                    ${escapeHTML(
                        training.date
                        ?? ""
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        training.event
                        ?? ""
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        training.id
                        ?? ""
                    )}
                </td>
                `;


            table.appendChild(
                row
            );

        }
    );


} catch (error) {

    console.error(
        "trainings error:",
        error
    );


    table.innerHTML =
        `
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


table.innerHTML =
    `
    <tr>
        <td colspan="3">
            読み込み中...
        </td>
    </tr>
    `;


try {

    const {
        data,
        error
    } = await supabaseClient
        .from("participations")
        .select("*");


    if (error) {

        throw error;

    }


    document
        .getElementById(
            "participationCount"
        )
        .textContent =
            data.length;


    if (
        data.length === 0
    ) {

        table.innerHTML =
            `
            <tr>
                <td colspan="3">
                    参加記録はありません。
                </td>
            </tr>
            `;

        return;

    }


    table.innerHTML =
        "";


    data.forEach(
        participation => {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML =
                `
                <td>
                    ${escapeHTML(
                        participation.participant_id
                        ?? ""
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        participation.training_id
                        ?? ""
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        participation.participated_at
                        ??
                        participation.created_at
                        ??
                        ""
                    )}
                </td>
                `;


            table.appendChild(
                row
            );

        }
    );


} catch (error) {

    console.error(
        "participations error:",
        error
    );


    table.innerHTML =
        `
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

function formatDate(
value
) {

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

    return value;

}


return date.toLocaleString(
    "ja-JP"
);
```

}

/* ========================
HTMLエスケープ
======================== */

function escapeHTML(
value
) {

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
