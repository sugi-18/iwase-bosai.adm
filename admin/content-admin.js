/* ==================================================
   岩瀬自治会 防災アプリ
   掲載コンテンツ管理
   ・次回訓練 最大3枚
   ・年間計画 最大3枚
   ・活動実績 最大3枚
================================================== */

"use strict";


/* ==================================================
   設定
================================================== */

const CONTENT_BUCKET =
    "site-content";

const CONTENT_MAX_IMAGES =
    3;


/* ==================================================
   初期化
================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupContentManagement();

    }
);


/* ==================================================
   セットアップ
================================================== */

function setupContentManagement() {

    const contentNavButton =
        document.querySelector(
            '[data-target="contentManagementSection"]'
        );

    if (!contentNavButton) {
        return;
    }


    contentNavButton.addEventListener(
        "click",
        async () => {

            await loadContentManagement();

        }
    );


    const addActivityButton =
        document.getElementById(
            "addActivityButton"
        );

    if (addActivityButton) {

        addActivityButton.addEventListener(
            "click",
            () => {

                openActivityEditor();

            }
        );

    }

}


/* ==================================================
   全体読み込み
================================================== */

async function loadContentManagement() {

    if (
        typeof adminSupabaseClient ===
        "undefined" ||
        !adminSupabaseClient
    ) {

        console.error(
            "Supabaseクライアントが利用できません。"
        );

        return;

    }


    await Promise.all([

        loadSiteContent(
            "next_training"
        ),

        loadSiteContent(
            "annual_schedule"
        ),

        loadActivities()

    ]);

}


/* ==================================================
   固定コンテンツ読み込み
================================================== */

async function loadSiteContent(
    contentType
) {

    const containerId =
        contentType ===
        "next_training"
            ? "nextTrainingImages"
            : "annualScheduleImages";


    const container =
        document.getElementById(
            containerId
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "読み込み中...";


    const {
        data,
        error
    } =
        await adminSupabaseClient
            .from(
                "site_contents"
            )
            .select("*")
            .eq(
                "content_type",
                contentType
            )
            .maybeSingle();


    if (error) {

        console.error(
            "コンテンツ取得エラー:",
            error
        );

        container.innerHTML =
            `<p class="content-error">
                読み込みに失敗しました。
            </p>`;

        return;

    }


    const row =
        data || {
            image1_url: null,
            image2_url: null,
            image3_url: null
        };


    renderSiteContent(
        container,
        contentType,
        row
    );

}


/* ==================================================
   固定コンテンツ表示
================================================== */

function renderSiteContent(
    container,
    contentType,
    row
) {

    container.innerHTML =
        "";


    for (
        let i = 1;
        i <= CONTENT_MAX_IMAGES;
        i++
    ) {

        const url =
            row[
                `image${i}_url`
            ];


        const card =
            document.createElement(
                "div"
            );

        card.className =
            "content-image-card";


        const title =
            document.createElement(
                "h4"
            );

        title.textContent =
            `画像${i}`;


        card.appendChild(
            title
        );


        if (url) {

            const preview =
                document.createElement(
                    "img"
                );

            preview.src =
                url;

            preview.alt =
                `${contentType} 画像${i}`;

            preview.className =
                "content-image-preview";


            card.appendChild(
                preview
            );

        } else {

            const empty =
                document.createElement(
                    "div"
                );

            empty.className =
                "content-image-empty";

            empty.textContent =
                "画像未登録";

            card.appendChild(
                empty
            );

        }


        const fileInput =
            document.createElement(
                "input"
            );

        fileInput.type =
            "file";

        fileInput.accept =
            "image/*";

        fileInput.className =
            "content-file-input";


        const uploadButton =
            document.createElement(
                "button"
            );

        uploadButton.type =
            "button";

        uploadButton.className =
            "secondary-button";

        uploadButton.textContent =
            url
                ? "画像を変更"
                : "画像を追加";


        uploadButton.addEventListener(
            "click",
            () => {

                fileInput.click();

            }
        );


        fileInput.addEventListener(
            "change",
            async () => {

                const file =
                    fileInput.files?.[0];

                if (!file) {
                    return;
                }


                await uploadSiteImage(
                    contentType,
                    i,
                    file
                );

            }
        );


        card.appendChild(
            fileInput
        );

        card.appendChild(
            uploadButton
        );


        if (url) {

            const deleteButton =
                document.createElement(
                    "button"
                );

            deleteButton.type =
                "button";

            deleteButton.className =
                "danger-button";

            deleteButton.textContent =
                "画像を削除";


            deleteButton.addEventListener(
                "click",
                async () => {

                    await deleteSiteImage(
                        contentType,
                        i,
                        url
                    );

                }
            );


            card.appendChild(
                deleteButton
            );

        }


        container.appendChild(
            card
        );

    }

}


/* ==================================================
   固定コンテンツ画像アップロード
================================================== */

async function uploadSiteImage(
    contentType,
    imageNumber,
    file
) {

    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        alert(
            "画像ファイルを選択してください。"
        );

        return;

    }


    if (
        file.size >
        10 * 1024 * 1024
    ) {

        alert(
            "画像サイズは10MB以下にしてください。"
        );

        return;

    }


    try {

        const extension =
            getFileExtension(
                file.name
            );


        const path =
            `${contentType}/image${imageNumber}_${Date.now()}.${extension}`;


        const {
            error: uploadError
        } =
            await adminSupabaseClient
                .storage
                .from(
                    CONTENT_BUCKET
                )
                .upload(
                    path,
                    file,
                    {
                        upsert: false,
                        contentType:
                            file.type
                    }
                );


        if (uploadError) {
            throw uploadError;
        }


        const {
            data: publicData
        } =
            adminSupabaseClient
                .storage
                .from(
                    CONTENT_BUCKET
                )
                .getPublicUrl(
                    path
                );


        const publicUrl =
            publicData.publicUrl;


        const column =
            `image${imageNumber}_url`;


        const {
            data: existing
        } =
            await adminSupabaseClient
                .from(
                    "site_contents"
                )
                .select("id")
                .eq(
                    "content_type",
                    contentType
                )
                .maybeSingle();


        let updateError;


        if (existing?.id) {

            const result =
                await adminSupabaseClient
                    .from(
                        "site_contents"
                    )
                    .update({
                        [column]:
                            publicUrl,
                        updated_at:
                            new Date().toISOString()
                    })
                    .eq(
                        "id",
                        existing.id
                    );

            updateError =
                result.error;

        } else {

            const result =
                await adminSupabaseClient
                    .from(
                        "site_contents"
                    )
                    .insert({
                        content_type:
                            contentType,
                        [column]:
                            publicUrl
                    });

            updateError =
                result.error;

        }


        if (updateError) {
            throw updateError;
        }


        alert(
            "画像を保存しました。"
        );


        await loadSiteContent(
            contentType
        );


    } catch (error) {

        console.error(
            "画像アップロードエラー:",
            error
        );

        alert(
            "画像のアップロードに失敗しました。\n" +
            error.message
        );

    }

}


/* ==================================================
   固定コンテンツ画像削除
================================================== */

async function deleteSiteImage(
    contentType,
    imageNumber,
    url
) {

    if (
        !confirm(
            `画像${imageNumber}を削除しますか？`
        )
    ) {

        return;

    }


    try {

        const column =
            `image${imageNumber}_url`;


        const {
            error
        } =
            await adminSupabaseClient
                .from(
                    "site_contents"
                )
                .update({
                    [column]:
                        null,
                    updated_at:
                        new Date().toISOString()
                })
                .eq(
                    "content_type",
                    contentType
                );


        if (error) {
            throw error;
        }


        alert(
            "画像を削除しました。"
        );


        await loadSiteContent(
            contentType
        );


    } catch (error) {

        console.error(
            "画像削除エラー:",
            error
        );

        alert(
            "画像の削除に失敗しました。"
        );

    }

}


/* ==================================================
   活動実績読み込み
================================================== */

async function loadActivities() {

    const container =
        document.getElementById(
            "activitiesManagementList"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "読み込み中...";


    const {
        data,
        error
    } =
        await adminSupabaseClient
            .from(
                "activities"
            )
            .select("*")
            .order(
                "display_order",
                {
                    ascending: true
                }
            )
            .order(
                "activity_date",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "活動実績取得エラー:",
            error
        );

        container.innerHTML =
            `<p class="content-error">
                活動実績を読み込めませんでした。
            </p>`;

        return;

    }


    container.innerHTML =
        "";


    if (
        !data ||
        data.length === 0
    ) {

        container.innerHTML =
            `<div class="content-empty-message">
                まだ活動実績が登録されていません。
            </div>`;

        return;

    }


    data.forEach(
        activity => {

            renderActivity(
                container,
                activity
            );

        }
    );

}


/* ==================================================
   活動実績表示
================================================== */

function renderActivity(
    container,
    activity
) {

    const card =
        document.createElement(
            "div"
        );

    card.className =
        "activity-management-card";


    const header =
        document.createElement(
            "div"
        );

    header.className =
        "activity-management-header";


    const title =
        document.createElement(
            "h4"
        );

    title.textContent =
        activity.title;


    const status =
        document.createElement(
            "span"
        );

    status.className =
        activity.is_published
            ? "content-status published"
            : "content-status unpublished";

    status.textContent =
        activity.is_published
            ? "公開中"
            : "非公開";


    header.appendChild(
        title
    );

    header.appendChild(
        status
    );


    card.appendChild(
        header
    );


    if (
        activity.activity_date
    ) {

        const date =
            document.createElement(
                "p"
            );

        date.className =
            "activity-date";

        date.textContent =
            formatDate(
                activity.activity_date
            );

        card.appendChild(
            date
        );

    }


    if (
        activity.description
    ) {

        const description =
            document.createElement(
                "p"
            );

        description.className =
            "activity-description";

        description.textContent =
            activity.description;

        card.appendChild(
            description
        );

    }


    const gallery =
        document.createElement(
            "div"
        );

    gallery.className =
        "activity-management-gallery";


    for (
        let i = 1;
        i <= CONTENT_MAX_IMAGES;
        i++
    ) {

        const url =
            activity[
                `image${i}_url`
            ];


        const imageBox =
            document.createElement(
                "div"
            );

        imageBox.className =
            "activity-image-box";


        if (url) {

            const img =
                document.createElement(
                    "img"
                );

            img.src =
                url;

            img.alt =
                `${activity.title} 写真${i}`;

            imageBox.appendChild(
                img
            );

        } else {

            const empty =
                document.createElement(
                    "div"
                );

            empty.className =
                "content-image-empty";

            empty.textContent =
                `写真${i} 未登録`;

            imageBox.appendChild(
                empty
            );

        }


        const input =
            document.createElement(
                "input"
            );

        input.type =
            "file";

        input.accept =
            "image/*";

        input.className =
            "content-file-input";


        const button =
            document.createElement(
                "button"
            );

        button.type =
            "button";

        button.className =
            "secondary-button";

        button.textContent =
            url
                ? `写真${i}を変更`
                : `写真${i}を追加`;


        button.addEventListener(
            "click",
            () => {

                input.click();

            }
        );


        input.addEventListener(
            "change",
            async () => {

                const file =
                    input.files?.[0];

                if (!file) {
                    return;
                }


                await uploadActivityImage(
                    activity,
                    i,
                    file
                );

            }
        );


        imageBox.appendChild(
            input
        );

        imageBox.appendChild(
            button
        );


        gallery.appendChild(
            imageBox
        );

    }


    card.appendChild(
        gallery
    );


    const actions =
        document.createElement(
            "div"
        );

    actions.className =
        "activity-management-actions";


    const editButton =
        document.createElement(
            "button"
        );

    editButton.type =
        "button";

    editButton.className =
        "secondary-button";

    editButton.textContent =
        "編集";


    editButton.addEventListener(
        "click",
        () => {

            openActivityEditor(
                activity
            );

        }
    );


    const publishButton =
        document.createElement(
            "button"
        );

    publishButton.type =
        "button";

    publishButton.className =
        "secondary-button";

    publishButton.textContent =
        activity.is_published
            ? "非公開にする"
            : "公開する";


    publishButton.addEventListener(
        "click",
        async () => {

            await toggleActivityPublished(
                activity
            );

        }
    );


    const deleteButton =
        document.createElement(
            "button"
        );

    deleteButton.type =
        "button";

    deleteButton.className =
        "danger-button";

    deleteButton.textContent =
        "削除";


    deleteButton.addEventListener(
        "click",
        async () => {

            await deleteActivity(
                activity
            );

        }
    );


    actions.appendChild(
        editButton
    );

    actions.appendChild(
        publishButton
    );

    actions.appendChild(
        deleteButton
    );


    card.appendChild(
        actions
    );


    container.appendChild(
        card
    );

}


/* ==================================================
   活動編集
================================================== */

function openActivityEditor(
    activity = null
) {

    const modal =
        document.createElement(
            "div"
        );

    modal.className =
        "content-editor-modal";


    modal.innerHTML = `
        <div class="content-editor-modal-inner">

            <h3>
                ${activity
                    ? "活動実績を編集"
                    : "活動実績を追加"}
            </h3>

            <label>
                活動タイトル
                <input
                    type="text"
                    id="activityEditorTitle"
                    value="${escapeAttribute(
                        activity?.title || ""
                    )}"
                    maxlength="100"
                >
            </label>

            <label>
                実施日
                <input
                    type="date"
                    id="activityEditorDate"
                    value="${
                        activity?.activity_date || ""
                    }"
                >
            </label>

            <label>
                活動内容
                <textarea
                    id="activityEditorDescription"
                    rows="5"
                    maxlength="1000"
                >${escapeHtml(
                    activity?.description || ""
                )}</textarea>
            </label>

            <div class="content-editor-actions">

                <button
                    type="button"
                    id="activityEditorSave"
                    class="primary-button"
                >
                    保存
                </button>

                <button
                    type="button"
                    id="activityEditorCancel"
                    class="secondary-button"
                >
                    キャンセル
                </button>

            </div>

        </div>
    `;


    document.body.appendChild(
        modal
    );


    document
        .getElementById(
            "activityEditorCancel"
        )
        ?.addEventListener(
            "click",
            () => {

                modal.remove();

            }
        );


    document
        .getElementById(
            "activityEditorSave"
        )
        ?.addEventListener(
            "click",
            async () => {

                await saveActivity(
                    activity,
                    modal
                );

            }
        );

}


/* ==================================================
   活動保存
================================================== */

async function saveActivity(
    activity,
    modal
) {

    const title =
        document
            .getElementById(
                "activityEditorTitle"
            )
            ?.value
            .trim();


    const activityDate =
        document
            .getElementById(
                "activityEditorDate"
            )
            ?.value || null;


    const description =
        document
            .getElementById(
                "activityEditorDescription"
            )
            ?.value
            .trim() || null;


    if (!title) {

        alert(
            "活動タイトルを入力してください。"
        );

        return;

    }


    try {

        const payload = {

            title,

            activity_date:
                activityDate,

            description,

            updated_at:
                new Date().toISOString()

        };


        let error;


        if (activity) {

            const result =
                await adminSupabaseClient
                    .from(
                        "activities"
                    )
                    .update(
                        payload
                    )
                    .eq(
                        "id",
                        activity.id
                    );

            error =
                result.error;

        } else {

            const result =
                await adminSupabaseClient
                    .from(
                        "activities"
                    )
                    .insert({
                        ...payload,
                        is_published:
                            true
                    });

            error =
                result.error;

        }


        if (error) {
            throw error;
        }


        modal.remove();


        alert(
            "活動実績を保存しました。"
        );


        await loadActivities();


    } catch (error) {

        console.error(
            "活動保存エラー:",
            error
        );

        alert(
            "活動実績の保存に失敗しました。\n" +
            error.message
        );

    }

}


/* ==================================================
   活動写真アップロード
================================================== */

async function uploadActivityImage(
    activity,
    imageNumber,
    file
) {

    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        alert(
            "画像ファイルを選択してください。"
        );

        return;

    }


    if (
        file.size >
        10 * 1024 * 1024
    ) {

        alert(
            "画像サイズは10MB以下にしてください。"
        );

        return;

    }


    try {

        const extension =
            getFileExtension(
                file.name
            );


        const path =
            `activities/${activity.id}/image${imageNumber}_${Date.now()}.${extension}`;


        const {
            error: uploadError
        } =
            await adminSupabaseClient
                .storage
                .from(
                    CONTENT_BUCKET
                )
                .upload(
                    path,
                    file,
                    {
                        upsert: false,
                        contentType:
                            file.type
                    }
                );


        if (uploadError) {
            throw uploadError;
        }


        const {
            data
        } =
            adminSupabaseClient
                .storage
                .from(
                    CONTENT_BUCKET
                )
                .getPublicUrl(
                    path
                );


        const column =
            `image${imageNumber}_url`;


        const {
            error
        } =
            await adminSupabaseClient
                .from(
                    "activities"
                )
                .update({
                    [column]:
                        data.publicUrl,
                    updated_at:
                        new Date().toISOString()
                })
                .eq(
                    "id",
                    activity.id
                );


        if (error) {
            throw error;
        }


        alert(
            "写真を保存しました。"
        );


        await loadActivities();


    } catch (error) {

        console.error(
            "活動写真アップロードエラー:",
            error
        );

        alert(
            "写真のアップロードに失敗しました。\n" +
            error.message
        );

    }

}


/* ==================================================
   公開 / 非公開
================================================== */

async function toggleActivityPublished(
    activity
) {

    try {

        const {
            error
        } =
            await adminSupabaseClient
                .from(
                    "activities"
                )
                .update({
                    is_published:
                        !activity.is_published,
                    updated_at:
                        new Date().toISOString()
                })
                .eq(
                    "id",
                    activity.id
                );


        if (error) {
            throw error;
        }


        await loadActivities();


    } catch (error) {

        console.error(
            "公開状態変更エラー:",
            error
        );

        alert(
            "公開状態の変更に失敗しました。"
        );

    }

}


/* ==================================================
   活動削除
================================================== */

async function deleteActivity(
    activity
) {

    if (
        !confirm(
            `「${activity.title}」を削除しますか？`
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
                    "activities"
                )
                .delete()
                .eq(
                    "id",
                    activity.id
                );


        if (error) {
            throw error;
        }


        await loadActivities();


    } catch (error) {

        console.error(
            "活動削除エラー:",
            error
        );

        alert(
            "活動実績の削除に失敗しました。"
        );

    }

}


/* ==================================================
   共通
================================================== */

function getFileExtension(
    filename
) {

    const parts =
        String(filename)
            .split(".");


    return (
        parts
            .pop()
            ?.toLowerCase()
            .replace(
                /[^a-z0-9]/g,
                ""
            ) ||
        "jpg"
    );

}


function formatDate(
    value
) {

    if (!value) {
        return "";
    }


    const date =
        new Date(
            `${value}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;

    }


    return (
        `${date.getFullYear()}年` +
        `${date.getMonth() + 1}月` +
        `${date.getDate()}日`
    );

}


function escapeHtml(
    value
) {

    return String(
        value ?? ""
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


function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    );

}


/* ==================================================
   追加CSS
================================================== */

const contentStyle =
document.createElement(
    "style"
);

contentStyle.textContent = `

.content-management-card {
    background: #fff;
    border-radius: 14px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 3px 12px rgba(0,0,0,.06);
}

.content-management-card h3 {
    margin-top: 0;
    margin-bottom: 6px;
}

.content-management-description {
    margin-top: 0;
    color: #777;
    font-size: 14px;
}

.content-image-grid {
    display: grid;
    grid-template-columns:
        repeat(3, minmax(0, 1fr));
    gap: 18px;
}

.content-image-card {
    border: 1px solid #ddd;
    border-radius: 12px;
    padding: 14px;
    background: #fafafa;
}

.content-image-card h4 {
    margin-top: 0;
}

.content-image-preview {
    width: 100%;
    height: 220px;
    object-fit: contain;
    background: #eee;
    border-radius: 8px;
    display: block;
    margin-bottom: 12px;
}

.content-image-empty {
    height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #eee;
    border-radius: 8px;
    color: #888;
    margin-bottom: 12px;
}

.content-file-input {
    display: none;
}

.content-image-card button,
.activity-image-box button {
    width: 100%;
    margin-top: 8px;
}

.danger-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: #d32f2f;
    color: #fff;
    padding: 10px 15px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
    min-height: 42px;
}

.danger-button:hover {
    background: #b71c1c;
}

.content-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
    margin-bottom: 20px;
}

.activities-management-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.activity-management-card {
    border: 1px solid #ddd;
    border-radius: 12px;
    padding: 20px;
}

.activity-management-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
}

.activity-management-header h4 {
    margin: 0;
    font-size: 19px;
}

.content-status {
    padding: 5px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
}

.content-status.published {
    background: #e8f5e9;
    color: #2e7d32;
}

.content-status.unpublished {
    background: #eee;
    color: #666;
}

.activity-date {
    color: #777;
    margin: 8px 0;
}

.activity-description {
    white-space: pre-wrap;
}

.activity-management-gallery {
    display: grid;
    grid-template-columns:
        repeat(3, minmax(0, 1fr));
    gap: 15px;
    margin-top: 15px;
}

.activity-image-box {
    border: 1px solid #ddd;
    border-radius: 10px;
    padding: 10px;
}

.activity-image-box img {
    width: 100%;
    height: 180px;
    object-fit: contain;
    background: #eee;
    border-radius: 7px;
}

.activity-management-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 18px;
}

.content-editor-modal {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0,0,0,.55);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.content-editor-modal-inner {
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    background: #fff;
    border-radius: 15px;
    padding: 25px;
    box-sizing: border-box;
}

.content-editor-modal-inner h3 {
    margin-top: 0;
}

.content-editor-modal-inner label {
    display: block;
    margin-top: 15px;
    font-weight: bold;
}

.content-editor-modal-inner input,
.content-editor-modal-inner textarea {
    display: block;
    width: 100%;
    box-sizing: border-box;
    margin-top: 6px;
    padding: 12px;
    border: 1px solid #ccc;
    border-radius: 8px;
    font: inherit;
}

.content-editor-actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
}

.content-error {
    color: #d32f2f;
}

.content-empty-message {
    padding: 30px;
    text-align: center;
    color: #777;
    background: #f7f7f7;
    border-radius: 10px;
}

@media (max-width: 700px) {

    .content-image-grid,
    .activity-management-gallery {
        grid-template-columns: 1fr;
    }

    .content-card-header {
        flex-direction: column;
        align-items: stretch;
    }

    .content-management-card {
        padding: 18px;
    }

}

`;

document.head.appendChild(
    contentStyle
);
