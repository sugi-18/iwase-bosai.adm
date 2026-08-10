// =====================================================
// いわぽん防災マイスター
// 認定証 JavaScript
// =====================================================



// =====================================================
// ページ読み込み
// =====================================================

window.addEventListener(
    "DOMContentLoaded",
    function () {

        loadCertificateData();

        setupPDFButton();

    }
);



// =====================================================
// 認定証データ表示
// =====================================================

function loadCertificateData() {


    // -------------------------------------------------
    // localStorageからデータ取得
    // -------------------------------------------------

    const savedData =
        localStorage.getItem(
            "iwaseStamp"
        );


    if (!savedData) {

        alert(
            "データがありません。"
        );

        history.back();

        return;

    }



    // -------------------------------------------------
    // JSON解析
    // -------------------------------------------------

    let data;

    try {

        data =
            JSON.parse(
                savedData
            );

    }
    catch (error) {

        console.error(
            "データ解析エラー:",
            error
        );

        alert(
            "データを読み込めませんでした。"
        );

        history.back();

        return;

    }



    // -------------------------------------------------
    // スタンプ5個以上
    // -------------------------------------------------

    if (
        !data.stamps ||
        data.stamps.length < 5
    ) {

        alert(
            "スタンプ5個以上で認定証を発行できます。"
        );

        history.back();

        return;

    }



    // -------------------------------------------------
    // 氏名
    // -------------------------------------------------

    const nameElement =
        document.getElementById(
            "name"
        );


    if (nameElement) {

        nameElement.textContent =
            data.name || "";

    }



    // -------------------------------------------------
    // 認定日
    // -------------------------------------------------

    const today =
        new Date();


    const date =
        today.getFullYear()
        + "年"
        + (today.getMonth() + 1)
        + "月"
        + today.getDate()
        + "日";


    const dateElement =
        document.getElementById(
            "date"
        );


    if (dateElement) {

        dateElement.textContent =
            date;

    }



    // -------------------------------------------------
    // 認定番号
    // -------------------------------------------------

    let certificateNumber =
        localStorage.getItem(
            "iwaseCertificateNumber"
        );


    if (!certificateNumber) {

        certificateNumber =
            "IW-"
            + today.getFullYear()
            + String(
                today.getMonth() + 1
            ).padStart(2, "0")
            + String(
                today.getDate()
            ).padStart(2, "0")
            + "-"
            + Math.floor(
                Math.random() * 9000
                + 1000
            );


        localStorage.setItem(
            "iwaseCertificateNumber",
            certificateNumber
        );

    }



    const numberElement =
        document.getElementById(
            "number"
        );


    if (numberElement) {

        numberElement.textContent =
            certificateNumber;

    }

}



// =====================================================
// PDFボタン設定
// =====================================================

function setupPDFButton() {


    const button =
        document.getElementById(
            "pdf-button"
        );


    if (!button) {

        return;

    }



    button.addEventListener(
        "click",
        createCertificatePDF
    );

}



// =====================================================
// PDF生成
// =====================================================

async function createCertificatePDF() {


    const original =
        document.getElementById(
            "certificate"
        );


    const button =
        document.getElementById(
            "pdf-button"
        );



    if (!original) {

        alert(
            "認定証が見つかりません。"
        );

        return;

    }



    // -------------------------------------------------
    // ライブラリ確認
    // -------------------------------------------------

    if (
        typeof html2canvas ===
        "undefined"
    ) {

        alert(
            "PDF生成ライブラリを読み込めませんでした。"
        );

        return;

    }


    if (
        !window.jspdf ||
        !window.jspdf.jsPDF
    ) {

        alert(
            "PDFライブラリを読み込めませんでした。"
        );

        return;

    }



    // -------------------------------------------------
    // ボタン無効化
    // -------------------------------------------------

    if (button) {

        button.disabled = true;

        button.textContent =
            "PDFを作成しています…";

    }



    let clone = null;



    try {


        // =================================================
        // フォント読み込み
        // =================================================

        if (
            document.fonts &&
            document.fonts.ready
        ) {

            await document.fonts.ready;

        }



        // =================================================
        // 認定証を複製
        // =================================================

        clone =
            original.cloneNode(
                true
            );


        clone.id =
            "certificate-pdf";



        // =================================================
        // PDF専用クラス
        // =================================================

        clone.classList.add(
            "pdf-certificate"
        );



        // =================================================
        // 画面外に配置
        // =================================================

        clone.style.position =
            "fixed";

        clone.style.left =
            "-12000px";

        clone.style.top =
            "0";

        clone.style.display =
            "block";

        clone.style.visibility =
            "visible";

        clone.style.zIndex =
            "-1";



        // =================================================
        // PDF用サイズ
        //
        // A4横と同じ比率
        //
        // 1000 × 707
        // =================================================

        clone.style.width =
            "1000px";

        clone.style.height =
            "707px";

        clone.style.maxWidth =
            "none";

        clone.style.minWidth =
            "1000px";

        clone.style.minHeight =
            "707px";

        clone.style.boxSizing =
            "border-box";

        clone.style.margin =
            "0";

        clone.style.background =
            "#ffffff";

        clone.style.overflow =
            "hidden";



        // =================================================
        // bodyへ追加
        // =================================================

        document.body.appendChild(
            clone
        );



        // =================================================
        // レイアウト確定
        // =================================================

        await new Promise(
            function (resolve) {

                requestAnimationFrame(
                    function () {

                        requestAnimationFrame(
                            function () {

                                resolve();

                            }
                        );

                    }
                );

            }
        );



        // =================================================
        // 少し待つ
        // =================================================

        await new Promise(
            function (resolve) {

                setTimeout(
                    resolve,
                    300
                );

            }
        );



        // =================================================
        // Canvas生成
        // =================================================

        const canvas =
            await html2canvas(
                clone,
                {

                    scale: 2,

                    width: 1000,

                    height: 707,

                    windowWidth: 1000,

                    windowHeight: 707,

                    useCORS: true,

                    backgroundColor:
                        "#ffffff",

                    scrollX: 0,

                    scrollY: 0,

                    logging: false

                }
            );



        // =================================================
        // Canvas確認
        // =================================================

        if (
            !canvas ||
            canvas.width <= 0 ||
            canvas.height <= 0
        ) {

            throw new Error(
                "Canvasの生成に失敗しました。"
            );

        }



        // =================================================
        // PNG化
        // =================================================

        const imageData =
            canvas.toDataURL(
                "image/png"
            );



        if (
            !imageData ||
            imageData ===
            "data:,"
        ) {

            throw new Error(
                "画像データの生成に失敗しました。"
            );

        }



        // =================================================
        // jsPDF
        // =================================================

        const jsPDF =
            window.jspdf.jsPDF;



        const pdf =
            new jsPDF(
                {

                    orientation:
                        "landscape",

                    unit:
                        "mm",

                    format:
                        "a4",

                    compress:
                        true

                }
            );



        // =================================================
        // A4横
        // =================================================

        const pageWidth =
            297;

        const pageHeight =
            210;



        // =================================================
        // 画像比率を維持
        // =================================================

        const imageRatio =
            canvas.width /
            canvas.height;


        let width =
            pageWidth;


        let height =
            width /
            imageRatio;



        if (
            height >
            pageHeight
        ) {

            height =
                pageHeight;

            width =
                height *
                imageRatio;

        }



        // =================================================
        // 中央配置
        // =================================================

        const x =
            (
                pageWidth -
                width
            ) / 2;


        const y =
            (
                pageHeight -
                height
            ) / 2;



        // =================================================
        // PDFへ画像追加
        // =================================================

        pdf.addImage(

            imageData,

            "PNG",

            x,

            y,

            width,

            height,

            undefined,

            "FAST"

        );



        // =================================================
        // Blobとして取得
        //
        // ここが今回の重要部分
        // 「保存」ではなくPDFを作る
        // =================================================

        const pdfBlob =
            pdf.output(
                "blob"
            );



        if (
            !pdfBlob ||
            pdfBlob.size <= 0
        ) {

            throw new Error(
                "PDFデータの生成に失敗しました。"
            );

        }



        // =================================================
        // Blob URL作成
        // =================================================

        const pdfURL =
            URL.createObjectURL(
                pdfBlob
            );



        // =================================================
        // PDF表示
        // =================================================

        const newWindow =
            window.open(
                pdfURL,
                "_blank"
            );



        // =================================================
        // ポップアップブロック対策
        // =================================================

        if (!newWindow) {

            // 新しいタブが開けなかった場合は
            // 同じページでPDFを表示

            window.location.href =
                pdfURL;

        }



        // =================================================
        // 少し時間を置いてURLを解放
        // =================================================

        setTimeout(
            function () {

                URL.revokeObjectURL(
                    pdfURL
                );

            },
            60000
        );


    }
    catch (error) {


        console.error(
            "認定証PDFエラー:",
            error
        );


        alert(
            "認定証PDFの作成に失敗しました。\n\n"
            + "もう一度お試しください。"
        );


    }
    finally {


        // =================================================
        // 複製した認定証を削除
        // =================================================

        if (clone) {

            clone.remove();

        }



        // =================================================
        // ボタン復元
        // =================================================

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "認定証PDFを見る";

        }

    }

}
