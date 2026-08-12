/* ==================================================
   岩瀬自治会 防災アプリ
   お知らせ・緊急情報表示
================================================== */

"use strict";


const ANNOUNCEMENT_SUPABASE_URL =
    "https://zumbqukrojdpgfpfekjr.supabase.co";


const ANNOUNCEMENT_SUPABASE_KEY =
    "sb_publishable_8YXsMHOxLr7MOTEYShUM3w_LsZvR3Qn";


let announcementClient =
    null;


/* ==================================================
   初期化
================================================== */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        try {

            if (
                typeof window.supabase ===
                "undefined"
            ) {

                throw new Error(
                    "Supabaseが読み込まれていません。"
                );

            }


            announcementClient =
                window.supabase.createClient(
                    ANNOUNCEMENT_SUPABASE_URL,
                    ANNOUNCEMENT_SUPABASE_KEY
                );


            await loadPublicAnnouncements();


        } catch (error) {

            console.error(
                "お知らせ初期化エラー:",
                error
            );

            showAnnouncementError();

        }

    }
);


/* ==================================================
   お知らせ取得
================================================== */

async function loadPublicAnnouncements() {

    const container =
        document.getElementById(
            "announcementList"
        );


    if (!container) {

        return;

    }


    const {
        data,
        error
    } =
        await announcementClient
            .from(
                "announcements"
            )
            .select(
                "id,title,body,type,published_at,expires_at"
            )
            .eq(
                "is_published",
                true
            )
            .or(
                "expires_at.is.null,expires_at.gt." +
                new Date().toISOString()
            )
            .order(
                "published_at",
                {
                    ascending: false
                }
            )
            .limit(
                10
            );


    if (error) {

        throw error;

    }


    renderPublicAnnouncements(
        container,
        data || []
    );

}


/* ==================================================
   表示
================================================== */

function renderPublicAnnouncements(
    container,
    announcements
) {

    container.innerHTML =
        "";


    if (
        announcements.length === 0
    ) {

        container.innerHTML = `

            <div class="announcement-empty">

                現在、お知らせはありません。

            </div>

        `;

        return;

    }


    announcements
        .sort(
            (
                a,
                b
            ) => {

                const priority = {

                    urgent: 0,

                    important: 1,

                    normal: 2

                };


                return (
                    priority[a.type] -
                    priority[b.type]
                );

            }
        )
        .forEach(
            announcement => {

                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "announcement-card " +
                    getPublicTypeClass(
                        announcement.type
                    );


                const label =
                    getPublicTypeLabel(
                        announcement.type
                    );


                const date =
                    formatPublicDate(
                        announcement.published_at
                    );


                card.innerHTML = `

                    <div
                        class="announcement-card-header"
                    >

                        <span
                            class="announcement-badge"
                        >
                            ${label}
                        </span>

                        <time>
                            ${date}
                        </time>

                    </div>


                    <h3>
                        ${escapeHtml(
                            announcement.title
                        )}
                    </h3>


                    <p>
                        ${escapeHtml(
                            announcement.body
                        ).replace(
                            /\n/g,
                            "<br>"
                        )}
                    </p>

                `;


                container.appendChild(
                    card
                );

            }
        );

}


/* ==================================================
   種類
================================================== */

function getPublicTypeClass(
    type
) {

    if (
        type ===
        "urgent"
    ) {

        return "announcement-urgent";

    }


    if (
        type ===
        "important"
    ) {

        return "announcement-important";

    }


    return "announcement-normal";

}


function getPublicTypeLabel(
    type
) {

    if (
        type ===
        "urgent"
    ) {

        return "🚨 緊急情報";

    }


    if (
        type ===
        "important"
    ) {

        return "⚠️ 重要なお知らせ";

    }


    return "📢 お知らせ";

}


/* ==================================================
   日付
================================================== */

function formatPublicDate(
    value
) {

    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return (

        date.getFullYear() +
        "/" +
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        ) +
        "/" +
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        )

    );

}


/* ==================================================
   エラー
================================================== */

function showAnnouncementError() {

    const container =
        document.getElementById(
            "announcementList"
        );


    if (!container) {

        return;

    }


    container.innerHTML = `

        <div class="announcement-error">

            お知らせを取得できませんでした。

        </div>

    `;

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


    return String(
        value
    )
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
