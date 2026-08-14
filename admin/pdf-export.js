/* ==================================================
   岩瀬自治会 防災アプリ
   管理者画面 PDF出力
   完成版

   対応
   ・参加者カルテPDF
   ・参加者分析PDF
   ・Chart.js
   ・A4印刷
   ・日本語
   ・PC
   ・iPhone
   ・iPad
   ・Android
================================================== */

"use strict";


/* ==================================================
   共通設定
================================================== */

const PDF_PRINT_DELAY = 800;

const PDF_IMAGE_LOAD_TIMEOUT = 5000;


/* ==================================================
   HTMLエスケープ
================================================== */

function escapePdfText(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* ==================================================
   日付
================================================== */

function formatPdfDate(date) {

    const d =
        date instanceof Date
            ? date
            : new Date(date);


    if (Number.isNaN(d.getTime())) {

        return "";

    }


    return (
        `${d.getFullYear()}/` +
        `${String(d.getMonth() + 1).padStart(2, "0")}/` +
        `${String(d.getDate()).padStart(2, "0")} ` +
        `${String(d.getHours()).padStart(2, "0")}:` +
        `${String(d.getMinutes()).padStart(2, "0")}`
    );

}


/* ==================================================
   印刷用CSS
================================================== */

function getPdfPrintCss() {

    return `

@page {

    size: A4 portrait;

    margin: 12mm;

}


* {

    box-sizing: border-box;

}


html,
body {

    margin: 0;

    padding: 0;

    background: #ffffff;

}


body {

    color: #222;

    font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Hiragino Kaku Gothic ProN",
        "Hiragino Sans",
        "Yu Gothic",
        "YuGothic",
        "Meiryo",
        sans-serif;

    font-size: 11px;

    line-height: 1.6;

    -webkit-print-color-adjust: exact;

    print-color-adjust: exact;

}


.pdf-document {

    width: 100%;

    max-width: 190mm;

    margin: 0 auto;

}


.pdf-header {

    border-bottom: 2px solid #333;

    padding-bottom: 8px;

    margin-bottom: 14px;

}


.pdf-header h1 {

    margin: 0 0 4px;

    font-size: 21px;

    line-height: 1.35;

}


.pdf-header p {

    margin: 0;

    font-size: 10px;

    color: #666;

}


.pdf-footer {

    margin-top: 18px;

    padding-top: 6px;

    border-top: 1px solid #ccc;

    font-size: 8px;

    color: #777;

    text-align: right;

}


button,
.action-button,
.modal-buttons,
.participant-card-delete,
.nav-button,
.secondary-button,
.primary-button {

    display: none !important;

}


/* -----------------------------------------------
   基本カード
------------------------------------------------ */

.dashboard-card,
.stat-card,
.participant-card,
.participant-card-profile,
.participant-card-stat,
.participant-card-info,
.participant-card-progress,
.participant-card-history,
.history-item,
.ranking-item,
.content-management-card {

    break-inside: avoid;

    page-break-inside: avoid;

}


/* -----------------------------------------------
   見出し
------------------------------------------------ */

h1,
h2,
h3,
h4 {

    break-after: avoid;

    page-break-after: avoid;

}


/* -----------------------------------------------
   統計カード
------------------------------------------------ */

.stats-grid {

    display: grid !important;

}


.stat-card {

    break-inside: avoid;

    page-break-inside: avoid;

}


/* -----------------------------------------------
   グラフ
------------------------------------------------ */

.chart-card {

    break-inside: avoid;

    page-break-inside: avoid;

}


.chart-container {

    width: 100% !important;

    height: 250px !important;

    max-height: 250px !important;

    position: relative;

}


.chart-container canvas {

    width: 100% !important;

    height: auto !important;

    max-width: 100% !important;

}


/* Canvasを画像化した場合 */

.chart-container img {

    display: block;

    width: 100% !important;

    height: auto !important;

    max-width: 100% !important;

}


/* -----------------------------------------------
   テーブル
------------------------------------------------ */

.table-wrapper {

    width: 100%;

    overflow: visible !important;

}


table {

    width: 100%;

    border-collapse: collapse;

    border-spacing: 0;

}


thead {

    display: table-header-group;

}


tfoot {

    display: table-footer-group;

}


tr {

    break-inside: avoid;

    page-break-inside: avoid;

}


th,
td {

    border: 1px solid #ccc;

    padding: 4px 6px;

    text-align: left;

    vertical-align: middle;

    font-size: 10px;

}


th {

    background: #f2f2f2 !important;

    font-weight: bold;

}


/* -----------------------------------------------
   ランキング
------------------------------------------------ */

.ranking-list {

    width: 100%;

}


.ranking-item {

    break-inside: avoid;

    page-break-inside: avoid;

}


/* -----------------------------------------------
   参加者カルテ
------------------------------------------------ */

.participant-card {

    width: 100%;

}


.participant-card-profile,
.participant-card-stat,
.participant-card-info,
.participant-card-progress,
.participant-card-history {

    break-inside: avoid;

    page-break-inside: avoid;

}


/* -----------------------------------------------
   プログレスバー
------------------------------------------------ */

.progress-bar,
.participant-card-progress-bar {

    print-color-adjust: exact;

    -webkit-print-color-adjust: exact;

}


/* -----------------------------------------------
   改ページ
------------------------------------------------ */

.pdf-page-break {

    break-before: page;

    page-break-before: always;

}


/* -----------------------------------------------
   不要なUI
------------------------------------------------ */

.hidden,
.screen.hidden {

    display: none !important;

}


/* -----------------------------------------------
   印刷
------------------------------------------------ */

@media print {

    html,
    body {

        background: #fff !important;

    }


    .pdf-document {

        width: 100%;

        max-width: none;

        margin: 0;

    }


    .no-print {

        display: none !important;

    }

}


/* -----------------------------------------------
   スマートフォン
------------------------------------------------ */

@media screen and (max-width: 600px) {

    body {

        font-size: 10px;

    }


    .pdf-document {

        max-width: none;

    }

}

`;

}


/* ==================================================
   印刷用ウィンドウを作成
================================================== */

function openPrintWindow(title, contentHtml) {

    const printWindow =
        window.open(
            "",
            "_blank",
            "width=1000,height=800"
        );


    if (!printWindow) {

        alert(
            "PDF出力用の画面を開けませんでした。\n\n" +
            "ブラウザのポップアップブロックを確認してください。"
        );

        return null;

    }


    const cssUrl =
        new URL(
            "admin.css",
            window.location.href
        ).href;


    const safeTitle =
        escapePdfText(title);


    const createdDate =
        formatPdfDate(
            new Date()
        );


    printWindow.document.open();


    printWindow.document.write(`

<!DOCTYPE html>

<html lang="ja">

<head>

<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
>

<title>
    ${safeTitle}
</title>


<link
    rel="stylesheet"
    href="${cssUrl}"
>


<style>

${getPdfPrintCss()}

</style>

</head>


<body>


<div class="pdf-document">


    <div class="pdf-header">

        <h1>
            ${safeTitle}
        </h1>

        <p>
            岩瀬自治会 防災アプリ
        </p>

    </div>


    <div id="pdfContent">

        ${contentHtml}

    </div>


    <div class="pdf-footer">

        岩瀬自治会 防災アプリ　
        作成日：
        ${escapePdfText(createdDate)}

    </div>


</div>


</body>

</html>

`);


    printWindow.document.close();


    return printWindow;

}


/* ==================================================
   画像読み込み待機
================================================== */

function waitForImages(
    documentObject,
    timeout = PDF_IMAGE_LOAD_TIMEOUT
) {

    const images =
        Array.from(
            documentObject.images || []
        );


    if (images.length === 0) {

        return Promise.resolve();

    }


    return new Promise(resolve => {

        let finished = false;

        let remaining =
            images.length;


        const finish = () => {

            if (finished) {

                return;

            }


            finished = true;

            resolve();

        };


        const check = () => {

            remaining--;

            if (remaining <= 0) {

                finish();

            }

        };


        images.forEach(image => {

            if (image.complete) {

                check();

                return;

            }


            image.addEventListener(
                "load",
                check,
                {
                    once: true
                }
            );


            image.addEventListener(
                "error",
                check,
                {
                    once: true
                }
            );

        });


        setTimeout(
            finish,
            timeout
        );

    });

}


/* ==================================================
   CanvasをPNG画像へ変換
================================================== */

function convertCanvasToImage(
    canvas
) {

    if (!canvas) {

        return null;

    }


    try {

        const image =
            document.createElement(
                "img"
            );


        image.src =
            canvas.toDataURL(
                "image/png"
            );


        image.alt =
            "グラフ";


        image.style.display =
            "block";


        image.style.width =
            "100%";


        image.style.height =
            "auto";


        image.style.maxWidth =
            "100%";


        return image;

    } catch (error) {

        console.error(
            "Canvas → image conversion error:",
            error
        );

        return null;

    }

}


/* ==================================================
   Canvasを画像へ変換
================================================== */

function convertCanvasesToImages(
    source
) {

    if (!source) {

        return;

    }


    const canvases =
        source.querySelectorAll(
            "canvas"
        );


    canvases.forEach(
        canvas => {

            const image =
                convertCanvasToImage(
                    canvas
                );


            if (!image) {

                return;

            }


            canvas.replaceWith(
                image
            );

        }
    );

}


/* ==================================================
   操作用UIを除去
================================================== */

function removePdfControls(
    root
) {

    if (!root) {

        return;

    }


    const selectors = [

        "button",

        ".modal-buttons",

        ".action-button",

        ".participant-card-delete",

        ".no-print",

        ".nav-button",

        "#refreshDashboardButton",

        "#refreshParticipantAnalysisButton",

        "#exportParticipantAnalysisPdfButton"

    ];


    root
        .querySelectorAll(
            selectors.join(",")
        )
        .forEach(
            element => {

                element.remove();

            }
        );

}


/* ==================================================
   空の読み込み中表示を整理
================================================== */

function cleanupPdfContent(
    root
) {

    if (!root) {

        return;

    }


    removePdfControls(
        root
    );


    /*
     * PDFに不要な入力フォーム
     */

    root
        .querySelectorAll(
            "input[type='hidden'], textarea"
        )
        .forEach(
            element =>
                element.remove()
        );


    /*
     * スクロール領域を解除
     */

    root
        .querySelectorAll(
            ".table-wrapper, " +
            ".history-content, " +
            ".ranking-list, " +
            ".participant-card-history"
        )
        .forEach(
            element => {

                element.style.maxHeight =
                    "none";

                element.style.height =
                    "auto";

                element.style.overflow =
                    "visible";

            }
        );


    /*
     * PDFでは横スクロールさせない
     */

    root
        .querySelectorAll("*")
        .forEach(
            element => {

                if (
                    element.style.overflow ===
                    "auto"
                ) {

                    element.style.overflow =
                        "visible";

                }

            }
        );

}


/* ==================================================
   印刷開始
================================================== */

async function startPrint(
    printWindow
) {

    if (!printWindow) {

        return;

    }


    try {

        /*
         * フォント・CSS等の読み込み待ち
         */

        if (
            printWindow.document.fonts &&
            printWindow.document.fonts.ready
        ) {

            try {

                await printWindow.document.fonts.ready;

            } catch (error) {

                console.warn(
                    "PDF font loading warning:",
                    error
                );

            }

        }


        /*
         * 画像読み込み待ち
         */

        await waitForImages(
            printWindow.document
        );


        /*
         * 最終待機
         */

        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    PDF_PRINT_DELAY
                )
        );


        printWindow.focus();


        /*
         * 印刷
         */

        printWindow.print();


    } catch (error) {

        console.error(
            "PDF print error:",
            error
        );


        try {

            printWindow.focus();

            printWindow.print();

        } catch (printError) {

            console.error(
                "Fallback print error:",
                printError
            );

        }

    }

}


/* ==================================================
   参加者カルテPDF
================================================== */

function exportParticipantCardPdf() {

    const content =
        document.getElementById(
            "participantCardContent"
        );


    if (!content) {

        alert(
            "参加者カルテの内容を取得できませんでした。"
        );

        return;

    }


    const title =
        document.getElementById(
            "participantCardTitle"
        )?.textContent
        ?.trim()
        ||
        "参加者カルテ";


    /*
     * 表示されているカルテを複製
     */

    const clone =
        content.cloneNode(
            true
        );


    /*
     * 操作ボタン除去
     */

    cleanupPdfContent(
        clone
    );


    /*
     * Canvasが存在する場合は画像化
     */

    convertCanvasesToImages(
        clone
    );


    /*
     * 印刷
     */

    const printWindow =
        openPrintWindow(
            title,
            clone.innerHTML
        );


    if (!printWindow) {

        return;

    }


    startPrint(
        printWindow
    );

}


/* ==================================================
   参加者分析PDF
================================================== */

function exportParticipantAnalysisPdf() {

    const section =
        document.getElementById(
            "participantAnalysisSection"
        );


    if (!section) {

        alert(
            "参加者分析画面を取得できませんでした。"
        );

        return;

    }


    /*
     * 現在表示されている画面を複製
     */

    const clone =
        section.cloneNode(
            true
        );


    /*
     * 操作用ボタンを除去
     */

    cleanupPdfContent(
        clone
    );


    /*
     * Canvasについては、
     *
     * 元画面のCanvasを画像化して
     * 複製側へ移植する。
     *
     * これによりChart.jsのグラフを
     * PDF側でも確実に表示する。
     */

    const originalCanvases =
        Array.from(
            section.querySelectorAll(
                "canvas"
            )
        );


    const clonedCanvases =
        Array.from(
            clone.querySelectorAll(
                "canvas"
            )
        );


    originalCanvases.forEach(
        (
            originalCanvas,
            index
        ) => {

            const clonedCanvas =
                clonedCanvases[index];


            if (
                !originalCanvas ||
                !clonedCanvas
            ) {

                return;

            }


            const image =
                convertCanvasToImage(
                    originalCanvas
                );


            if (!image) {

                return;

            }


            /*
             * 元Canvasの表示サイズを
             * できるだけ維持
             */

            const rect =
                originalCanvas.getBoundingClientRect();


            if (
                rect &&
                rect.width > 0
            ) {

                image.style.width =
                    `${rect.width}px`;

            }


            image.style.maxWidth =
                "100%";


            clonedCanvas.replaceWith(
                image
            );

        }
    );


    /*
     * PDF用タイトル
     */

    const title =
        "防災訓練 参加者分析";


    /*
     * 印刷ウィンドウ
     */

    const printWindow =
        openPrintWindow(
            title,
            clone.innerHTML
        );


    if (!printWindow) {

        return;

    }


    startPrint(
        printWindow
    );

}


/* ==================================================
   グローバル公開
================================================== */

window.exportParticipantCardPdf =
    exportParticipantCardPdf;


window.exportParticipantAnalysisPdf =
    exportParticipantAnalysisPdf;


/* ==================================================
   デバッグ用
================================================== */

console.log(
    "pdf-export.js initialized."
);
