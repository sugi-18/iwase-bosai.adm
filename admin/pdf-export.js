/* ==================================================
   岩瀬自治会 防災アプリ
   管理者画面 PDF出力
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
    ${escapePdfText(title)}
</title>

<link
    rel="stylesheet"
    href="${cssUrl}"
>

<style>

@page {
    size: A4;
    margin: 12mm;
}


* {
    box-sizing: border-box;
}


body {

    margin: 0;

    padding: 0;

    background: #ffffff;

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


.pdf-document {

    width: 100%;

    max-width: 190mm;

    margin: 0 auto;

}


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


.pdf-footer {

    margin-top: 20px;

    padding-top: 6px;

    border-top:
        1px solid #ccc;

    font-size: 9px;

    color: #777;

    text-align: right;

}


button,
.action-button,
.modal-buttons,
.participant-card-delete {

    display: none !important;

}


canvas {

    max-width: 100% !important;

    height: auto !important;

}


.chart-container {

    height: 260px !important;

    max-height: 260px !important;

}


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


@media print {

    body {

        background: #fff;

    }


    .pdf-document {

        max-width: none;

    }

}

</style>

</head>


<body>

<div class="pdf-document">

    <div class="pdf-header">

        <h1>
            ${escapePdfText(title)}
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
        ${formatPdfDate(new Date())}

    </div>

</div>

</body>

</html>
    `);


    printWindow.document.close();


    /*
     * 少し待ってから印刷
     *
     * CSS・画像・Canvas等の反映を待つ
     */

    setTimeout(
        () => {

            printWindow.focus();

            printWindow.print();

        },
        700
    );

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
   Canvasを画像へ変換
================================================== */

function convertCanvasesToImages(
    source
) {

    const canvases =
        source.querySelectorAll(
            "canvas"
        );


    canvases.forEach(
        canvas => {

            try {

                const image =
                    document.createElement(
                        "img"
                    );


                image.src =
                    canvas.toDataURL(
                        "image/png"
                    );


                image.style.width =
                    "100%";

                image.style.height =
                    "auto";


                canvas.replaceWith(
                    image
                );

            } catch (error) {

                console.error(
                    "Canvas PDF conversion error:",
                    error
                );

            }

        }
    );

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
        content.cloneNode(
            true
        );


    /*
     * 操作用ボタンを除去
     */

    clone
        .querySelectorAll(
            "button"
        )
        .forEach(
            button =>
                button.remove()
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
     * 最新データが表示されているか確認
     */

    const total =
        document.getElementById(
            "analysisTotalParticipants"
        )?.textContent?.trim();


    if (
        total === "" ||
        total === "0"
    ) {

        /*
         * 0人の場合でもPDFは作れるため、
         * エラーにはしない
         */

    }


    const clone =
        section.cloneNode(
            true
        );


    /*
     * 更新ボタン等を除去
     */

    clone
        .querySelectorAll(
            "button"
        )
        .forEach(
            button =>
                button.remove()
        );


    /*
     * Canvasを画像化
     *
     * 現在画面に表示されている
     * Chart.jsグラフをPDF側へ持っていく
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


            try {

                const image =
                    document.createElement(
                        "img"
                    );


                image.src =
                    originalCanvas.toDataURL(
                        "image/png"
                    );


                image.style.width =
                    "100%";

                image.style.height =
                    "auto";


                clonedCanvas.replaceWith(
                    image
                );

            } catch (error) {

                console.error(
                    "Analysis chart conversion error:",
                    error
                );

            }

        }
    );


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
