/* ==================================================
   岩瀬自治会 防災アプリ
   管理者画面 PDF出力

   完成版

   対応
   ・参加者分析PDF
   ・参加者カルテPDF
   ・Chart.jsグラフ
   ・hiddenクラス対策
   ・印刷ウィンドウ表示安定化
   ・Chrome / Edge / Safari
================================================== */

"use strict";


/* ==================================================
   共通：印刷用ウィンドウ
================================================== */

function openPrintWindow(
    title,
    contentHtml
) {

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

        return;

    }


    const cssUrl =
        new URL(
            "admin.css",
            window.location.href
        ).href;


    /*
     * 印刷用HTML
     */

    const html = `
<!DOCTYPE html>

<html lang="ja">

<head>

<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
>

<title>
    ${escapePdfText(title)}
</title>


<link
    rel="stylesheet"
    href="${cssUrl}"
>


<style>

/* ==================================================
   PDF基本設定
================================================== */

@page {

    size: A4;

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
        "Meiryo",
        sans-serif;

    font-size: 12px;

    line-height: 1.6;

}


/* ==================================================
   PDF本体
================================================== */

.pdf-document {

    width: 100%;

    max-width: 190mm;

    margin: 0 auto;

}


/* ==================================================
   PDFヘッダー
================================================== */

.pdf-header {

    border-bottom:
        2px solid #333;

    padding-bottom: 8px;

    margin-bottom: 14px;

}


.pdf-header h1 {

    margin: 0 0 4px;

    font-size: 22px;

}


.pdf-header p {

    margin: 0;

    font-size: 11px;

    color: #666;

}


/* ==================================================
   PDFフッター
================================================== */

.pdf-footer {

    margin-top: 20px;

    padding-top: 6px;

    border-top:
        1px solid #ccc;

    font-size: 9px;

    color: #777;

    text-align: right;

}


/* ==================================================
   hidden対策
================================================== */

/*
 * 元画面では hidden でも、
 * PDF側では表示する。
 */

.hidden {

    display: block !important;

}


.content-section {

    display: block !important;

}


#participantAnalysisSection {

    display: block !important;

    visibility: visible !important;

}


/* ==================================================
   操作用UIを非表示
================================================== */

button,
.action-button,
.modal-buttons,
.participant-card-delete,
.nav-button,
.admin-nav,
#refreshParticipantAnalysisButton,
#exportParticipantAnalysisPdfButton {

    display: none !important;

}


/* ==================================================
   不要な画面要素
================================================== */

.screen {

    display: block !important;

}


.screen.hidden {

    display: block !important;

}


/* ==================================================
   Canvas
================================================== */

canvas {

    max-width: 100% !important;

}


/* ==================================================
   グラフ
================================================== */

.chart-container {

    height: 260px !important;

    max-height: 260px !important;

    overflow: visible !important;

}


.chart-container img {

    display: block;

    width: 100%;

    height: auto;

}


/* ==================================================
   改ページ
================================================== */

.dashboard-card,
.stat-card,
.participant-card,
.participant-card-profile,
.participant-card-stat,
.participant-card-info,
.participant-card-progress,
.participant-card-history,
.history-item,
.ranking-item {

    break-inside: avoid;

    page-break-inside: avoid;

}


table {

    width: 100%;

    border-collapse: collapse;

}


th,
td {

    border:
        1px solid #ccc;

    padding: 5px 7px;

    text-align: left;

}


th {

    background: #f2f2f2;

    font-weight: bold;

}


h1,
h2,
h3 {

    break-after: avoid;

    page-break-after: avoid;

}


/* ==================================================
   印刷時
================================================== */

@media print {

    html,
    body {

        background: #ffffff !important;

    }


    .pdf-document {

        max-width: none;

    }


    .hidden {

        display: block !important;

    }


    .content-section {

        display: block !important;

    }

}

</style>

</head>


<body>

<div class="pdf-document">


    <!-- PDFヘッダー -->

    <div class="pdf-header">

        <h1>
            ${escapePdfText(title)}
        </h1>

        <p>
            岩瀬自治会 防災アプリ
        </p>

    </div>


    <!-- PDF本体 -->

    <div id="pdfContent">

        ${contentHtml}

    </div>


    <!-- PDFフッター -->

    <div class="pdf-footer">

        岩瀬自治会 防災アプリ　
        作成日：
        ${formatPdfDate(new Date())}

    </div>


</div>


<script>

/*
 * 印刷準備完了
 */

window.addEventListener(
    "load",
    function () {

        setTimeout(
            function () {

                window.focus();

                window.print();

            },
            500
        );

    }
);

</script>


</body>

</html>
`;


    /*
     * HTMLを書き込む
     */

    printWindow.document.open();

    printWindow.document.write(
        html
    );

    printWindow.document.close();

}


/* ==================================================
   HTMLエスケープ
================================================== */

function escapePdfText(
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


/* ==================================================
   日付
================================================== */

function formatPdfDate(
    date
) {

    const d =
        date instanceof Date
            ? date
            : new Date(date);


    if (
        Number.isNaN(
            d.getTime()
        )
    ) {

        return "";

    }


    return `${d.getFullYear()}/` +
           `${String(
               d.getMonth() + 1
           ).padStart(2, "0")}/` +
           `${String(
               d.getDate()
           ).padStart(2, "0")} ` +
           `${String(
               d.getHours()
           ).padStart(2, "0")}:` +
           `${String(
               d.getMinutes()
           ).padStart(2, "0")}`;

}


/* ==================================================
   Canvas → 画像
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
            "Canvas PDF conversion error:",
            error
        );

        return null;

    }

}


/* ==================================================
   PDF用クローンを作成
================================================== */

function createPdfClone(
    source
) {

    const clone =
        source.cloneNode(
            true
        );


    /*
     * ★最重要
     *
     * 元画面の hidden を解除
     */

    clone.classList.remove(
        "hidden"
    );


    /*
     * hidden属性も解除
     */

    clone.removeAttribute(
        "hidden"
    );


    /*
     * style属性によるdisplay:noneも解除
     */

    clone.style.display =
        "block";


    clone.style.visibility =
        "visible";


    /*
     * 子要素の hidden も解除
     */

    clone
        .querySelectorAll(
            ".hidden"
        )
        .forEach(
            element => {

                element.classList.remove(
                    "hidden"
                );

                element.style.display =
                    "";

                element.style.visibility =
                    "visible";

            }
        );


    /*
     * hidden属性
     */

    clone
        .querySelectorAll(
            "[hidden]"
        )
        .forEach(
            element => {

                element.removeAttribute(
                    "hidden"
                );

            }
        );


    /*
     * 操作用ボタンを除去
     */

    clone
        .querySelectorAll(
            "button"
        )
        .forEach(
            button => {

                button.remove();

            }
        );


    /*
     * ナビゲーションを除去
     */

    clone
        .querySelectorAll(
            ".admin-nav"
        )
        .forEach(
            element => {

                element.remove();

            }
        );


    return clone;

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
        )?.textContent?.trim()
        ||
        "参加者カルテ";


    const clone =
        createPdfClone(
            content
        );


    /*
     * Canvasを画像化
     */

    const originalCanvases =
        content.querySelectorAll(
            "canvas"
        );


    const clonedCanvases =
        clone.querySelectorAll(
            "canvas"
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


            if (image) {

                clonedCanvas.replaceWith(
                    image
                );

            }

        }
    );


    openPrintWindow(
        title,
        clone.innerHTML
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
     * PDF用クローン
     *
     * ★ここで hidden を解除する
     */

    const clone =
        createPdfClone(
            section
        );


    /*
     * Canvas
     *
     * 元画面に表示されているChart.jsを
     * PNG画像へ変換する
     */

    const originalCanvases =
        section.querySelectorAll(
            "canvas"
        );


    const clonedCanvases =
        clone.querySelectorAll(
            "canvas"
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


            if (image) {

                clonedCanvas.replaceWith(
                    image
                );

            }

        }
    );


    /*
     * PDF出力
     */

    openPrintWindow(
        "防災訓練 参加者分析",
        clone.innerHTML
    );

}


/* ==================================================
   グローバル公開
================================================== */

window.exportParticipantCardPdf =
    exportParticipantCardPdf;


window.exportParticipantAnalysisPdf =
    exportParticipantAnalysisPdf;
