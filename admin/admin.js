:::writing{variant="document" id="73526"}
const ADMIN_PASSWORD = "iwase-admin-2026";

document.addEventListener("DOMContentLoaded", function () {

    const loginButton = document.getElementById("loginButton");
    const logoutButton = document.getElementById("logoutButton");

    if (loginButton) {
        loginButton.addEventListener("click", adminLogin);
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", adminLogout);
    }

    checkAdminLogin();

});


function checkAdminLogin() {

    const login = localStorage.getItem("iwaseAdminLogin");

    if (login === "true") {
        showAdminArea();
    } else {
        showLoginArea();
    }

}


function adminLogin() {

    const password =
        document.getElementById("adminPassword").value;

    const error =
        document.getElementById("loginError");

    if (password === ADMIN_PASSWORD) {

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

}


function showAdminArea() {

    document
        .getElementById("loginArea")
        .classList
        .add("hidden");

    document
        .getElementById("adminArea")
        .classList
        .remove("hidden");

}


function showLoginArea() {

    document
        .getElementById("loginArea")
        .classList
        .remove("hidden");

    document
        .getElementById("adminArea")
        .classList
        .add("hidden");

}


function adminLogout() {

    localStorage.removeItem("iwaseAdminLogin");

    location.reload();

}
:::
