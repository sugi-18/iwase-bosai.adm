/* ==================================================
   岩瀬自治会 防災アプリ
   Step 2
   参加者分析
================================================== */

(function () {

"use strict";


/* ==================================================
   状態
================================================== */

let participantAnalysisChart = null;

let analysisParticipants = [];

let analysisParticipations = [];


/* ==================================================
   初期化
================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupParticipantAnalysis();

    }
);


/* ==================================================
   セットアップ
================================================== */

function setupParticipantAnalysis() {

    const refreshButton =
        document.getElementById(
            "refreshParticipantAnalysisButton"
        );


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            async () => {

                await loadParticipantAnalysis();

            }
        );

    }


    const analysisSection =
        document.getElementById(
            "participantAnalysisSection"
        );


    if (analysisSection) {

        const observer =
            new MutationObserver(
                mutations => {

                    mutations.forEach(
                        mutation => {

                            if (
                                mutation.attributeName ===
                                "class"
                            ) {

                                if (
                                    !analysisSection.classList.contains(
                                        "hidden"
                                    )
                                ) {

                                    loadParticipantAnalysis();

                                }

                            }

                        }
                    );

                }
            );


        observer.observe(
            analysisSection,
            {
                attributes: true
            }
        );

    }

}


/* ==================================================
   Supabase確認
================================================== */

function getSupabaseClient() {

    if (
        typeof adminSupabaseClient !==
        "undefined" &&
        adminSupabaseClient
    ) {

        return adminSupabaseClient;

    }


    if (
        typeof window.supabase !==
        "undefined"
    ) {

        return window.supabase;

    }


    return null;

}


/* ==================================================
   分析データ読み込み
================================================== */

async function loadParticipantAnalysis() {

    const client =
        getSupabaseClient();


    if (!client) {

        showAnalysisError(
            "Supabaseに接続できません。"
        );

        return;

    }


    try {

        showAnalysisLoading();


        const [
            participantsResult,
            participationsResult
        ] =
            await Promise.all([

                client
                    .from("participants")
                    .select(
                        "participant_id, name"
                    ),

                client
                    .from("participations")
                    .select(
                        "id, participant_id, training_id, registered_at"
                    )

            ]);


        if (
            participantsResult.error
        ) {

            throw participantsResult.error;

        }


        if (
            participationsResult.error
        ) {

            throw participationsResult.error;

        }


        analysisParticipants =
            participantsResult.data ||
            [];


        analysisParticipations =
            participationsResult.data ||
            [];


        renderParticipantAnalysis();


    } catch (error) {

        console.error(
            "Participant analysis error:",
            error
        );


        showAnalysisError(
            "参加者分析の読み込みに失敗しました。\n" +
            error.message
        );

    }

}


/* ==================================================
   分析表示
================================================== */

function renderParticipantAnalysis() {

    const participantCount =
        analysisParticipants.length;


    const participationCount =
        analysisParticipations.length;


    /* ----------------------------------------------
       参加回数集計
    ---------------------------------------------- */

    const participationMap =
        {};


    analysisParticipants.forEach(
        participant => {

            participationMap[
                participant.participant_id
            ] = 0;

        }
    );


    analysisParticipations.forEach(
        participation => {

            const id =
                participation.participant_id;


            if (
                Object.prototype.hasOwnProperty.call(
                    participationMap,
                    id
                )
            ) {

                participationMap[id]++;

            }

        }
    );


    /* ----------------------------------------------
       基本数値
    ---------------------------------------------- */

    let activeCount = 0;

    let repeatCount = 0;

    let masterCount = 0;


    analysisParticipants.forEach(
        participant => {

            const count =
                participationMap[
                    participant.participant_id
                ] || 0;


            if (count >= 1) {

                activeCount++;

            }


            if (count >= 2) {

                repeatCount++;

            }


            if (count >= 5) {

                masterCount++;

            }

        }
    );


    const inactiveCount =
        Math.max(
            participantCount -
            activeCount,
            0
        );


    const participationRate =
        participantCount > 0
            ? (
                activeCount /
                participantCount *
                100
            )
            : 0;


    const averageParticipation =
        participantCount > 0
            ? (
                participationCount /
                participantCount
            )
            : 0;


    const masterRate =
        participantCount > 0
            ? (
                masterCount /
                participantCount *
                100
            )
            : 0;


    /* ----------------------------------------------
       数値表示
    ---------------------------------------------- */

    setText(
        "analysisTotalParticipants",
        participantCount
    );


    setText(
        "analysisActiveParticipants",
        activeCount
    );


    setText(
        "analysisInactiveParticipants",
        inactiveCount
    );


    setText(
        "analysisParticipationRate",
        participationRate.toFixed(1)
    );


    setText(
        "analysisAverageParticipation",
        averageParticipation.toFixed(1)
    );


    setText(
        "analysisRepeatParticipants",
        repeatCount
    );


    setText(
        "analysisMasterParticipants",
        masterCount
    );


    setText(
        "analysisMasterRate",
        masterRate.toFixed(1)
    );


    /* ----------------------------------------------
       参加回数別データ
    ---------------------------------------------- */

    const distribution =
        createDistribution(
            participationMap
        );


    renderDistributionChart(
        distribution
    );


    /* ----------------------------------------------
       ランキング
    ---------------------------------------------- */

    renderRanking(
        participationMap
    );


    /* ----------------------------------------------
       未参加者
    ---------------------------------------------- */

    renderInactiveParticipants(
        participationMap
    );


    /* ----------------------------------------------
       全参加者
    ---------------------------------------------- */

    renderParticipantTable(
        participationMap
    );

}


/* ==================================================
   参加回数分布
================================================== */

function createDistribution(
    participationMap
) {

    const distribution = {

        zero: 0,

        one: 0,

        twoThree: 0,

        four: 0,

        fivePlus: 0

    };


    Object.values(
        participationMap
    ).forEach(
        count => {

            if (count === 0) {

                distribution.zero++;

            } else if (
                count === 1
            ) {

                distribution.one++;

            } else if (
                count >= 2 &&
                count <= 3
            ) {

                distribution.twoThree++;

            } else if (
                count === 4
            ) {

                distribution.four++;

            } else {

                distribution.fivePlus++;

            }

        }
    );


    return distribution;

}


/* ==================================================
   グラフ
================================================== */

function renderDistributionChart(
    distribution
) {

    const canvas =
        document.getElementById(
            "participantDistributionChart"
        );


    if (!canvas) {

        return;

    }


    if (
        typeof Chart ===
        "undefined"
    ) {

        console.error(
            "Chart.jsが読み込まれていません。"
        );

        return;

    }


    if (
        participantAnalysisChart
    ) {

        participantAnalysisChart.destroy();

    }


    participantAnalysisChart =
        new Chart(
            canvas,
            {

                type: "bar",

                data: {

                    labels: [

                        "0回",

                        "1回",

                        "2～3回",

                        "4回",

                        "5回以上"

                    ],

                    datasets: [

                        {

                            label:
                                "参加者数",

                            data: [

                                distribution.zero,

                                distribution.one,

                                distribution.twoThree,

                                distribution.four,

                                distribution.fivePlus

                            ],

                            borderWidth: 1

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {

                            display: false

                        }

                    },

                    scales: {

                        y: {

                            beginAtZero: true,

                            ticks: {

                                precision: 0

                            }

                        }

                    }

                }

            }
        );

}


/* ==================================================
   ランキング
================================================== */

function renderRanking(
    participationMap
) {

    const container =
        document.getElementById(
            "analysisRanking"
        );


    if (!container) {

        return;

    }


    const ranking =
        analysisParticipants
            .map(
                participant => ({

                    participant,

                    count:
                        participationMap[
                            participant.participant_id
                        ] || 0

                })
            )
            .sort(
                (a, b) =>
                    b.count -
                    a.count
            );


    if (
        ranking.length === 0
    ) {

        container.innerHTML =
            `<div class="analysis-empty">
                参加者が登録されていません。
            </div>`;

        return;

    }


    const topRanking =
        ranking.slice(
            0,
            10
        );


    container.innerHTML =
        "";


    topRanking.forEach(
        (item, index) => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "analysis-ranking-item";


            const rank =
                index + 1;


            row.innerHTML = `

                <span
                    class="analysis-rank"
                >
                    ${rank}
                </span>

                <div
                    class="analysis-ranking-name"
                >
                    ${escapeHtml(
                        item.participant.name ||
                        "名前未登録"
                    )}
                </div>

                <strong>
                    ${item.count}
                    <span>回</span>
                </strong>

            `;


            container.appendChild(
                row
            );

        }
    );

}


/* ==================================================
   未参加者
================================================== */

function renderInactiveParticipants(
    participationMap
) {

    const container =
        document.getElementById(
            "analysisInactiveList"
        );


    if (!container) {

        return;

    }


    const inactive =
        analysisParticipants
            .filter(
                participant =>
                    (
                        participationMap[
                            participant.participant_id
                        ] || 0
                    ) === 0
            )
            .sort(
                (a, b) =>
                    String(
                        a.name || ""
                    ).localeCompare(
                        String(
                            b.name || ""
                        ),
                        "ja"
                    )
            );


    if (
        inactive.length === 0
    ) {

        container.innerHTML =
            `<div class="analysis-empty success">
                全員が1回以上参加しています。
            </div>`;

        return;

    }


    container.innerHTML =
        "";


    inactive.forEach(
        participant => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "analysis-inactive-item";


            item.innerHTML = `

                <span>
                    ${escapeHtml(
                        participant.name ||
                        "名前未登録"
                    )}
                </span>

                <span class="inactive-badge">
                    未参加
                </span>

            `;


            container.appendChild(
                item
            );

        }
    );

}


/* ==================================================
   参加者一覧
================================================== */

function renderParticipantTable(
    participationMap
) {

    const tbody =
        document.getElementById(
            "participantAnalysisTable"
        );


    if (!tbody) {

        return;

    }


    const ranking =
        analysisParticipants
            .map(
                participant => ({

                    participant,

                    count:
                        participationMap[
                            participant.participant_id
                        ] || 0

                })
            )
            .sort(
                (a, b) => {

                    if (
                        b.count !==
                        a.count
                    ) {

                        return (
                            b.count -
                            a.count
                        );

                    }


                    return String(
                        a.participant.name ||
                        ""
                    ).localeCompare(
                        String(
                            b.participant.name ||
                            ""
                        ),
                        "ja"
                    );

                }
            );


    tbody.innerHTML =
        "";


    if (
        ranking.length === 0
    ) {

        tbody.innerHTML =
            `<tr>
                <td colspan="4">
                    参加者が登録されていません。
                </td>
            </tr>`;

        return;

    }


    ranking.forEach(
        (item, index) => {

            const tr =
                document.createElement(
                    "tr"
                );


            let status = "";


            if (
                item.count === 0
            ) {

                status =
                    `<span class="analysis-status inactive">
                        未参加
                    </span>`;

            } else if (
                item.count >= 5
            ) {

                status =
                    `<span class="analysis-status master">
                        5回以上
                    </span>`;

            } else if (
                item.count >= 2
            ) {

                status =
                    `<span class="analysis-status repeat">
                        リピーター
                    </span>`;

            } else {

                status =
                    `<span class="analysis-status active">
                        参加経験あり
                    </span>`;

            }


            tr.innerHTML = `

                <td>
                    ${index + 1}
                </td>

                <td>
                    ${escapeHtml(
                        item.participant.name ||
                        "名前未登録"
                    )}
                </td>

                <td>
                    <strong>
                        ${item.count}
                    </strong>
                    回
                </td>

                <td>
                    ${status}
                </td>

            `;


            tbody.appendChild(
                tr
            );

        }
    );

}


/* ==================================================
   ローディング
================================================== */

function showAnalysisLoading() {

    const ids = [

        "analysisTotalParticipants",

        "analysisActiveParticipants",

        "analysisInactiveParticipants",

        "analysisParticipationRate",

        "analysisAverageParticipation",

        "analysisRepeatParticipants",

        "analysisMasterParticipants",

        "analysisMasterRate"

    ];


    ids.forEach(
        id => {

            setText(
                id,
                "..."
            );

        }
    );


    const ranking =
        document.getElementById(
            "analysisRanking"
        );


    if (ranking) {

        ranking.innerHTML =
            `<div class="analysis-loading">
                読み込み中...
            </div>`;

    }


    const inactive =
        document.getElementById(
            "analysisInactiveList"
        );


    if (inactive) {

        inactive.innerHTML =
            `<div class="analysis-loading">
                読み込み中...
            </div>`;

    }


    const table =
        document.getElementById(
            "participantAnalysisTable"
        );


    if (table) {

        table.innerHTML =
            `<tr>
                <td colspan="4">
                    読み込み中...
                </td>
            </tr>`;

    }

}


/* ==================================================
   エラー
================================================== */

function showAnalysisError(
    message
) {

    const ids = [

        "analysisRanking",

        "analysisInactiveList"

    ];


    ids.forEach(
        id => {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.innerHTML =
                    `<div class="analysis-error">
                        ${escapeHtml(
                            message
                        )}
                    </div>`;

            }

        }
    );


    const table =
        document.getElementById(
            "participantAnalysisTable"
        );


    if (table) {

        table.innerHTML =
            `<tr>
                <td colspan="4">
                    読み込みに失敗しました。
                </td>
            </tr>`;

    }

}


/* ==================================================
   テキスト
================================================== */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


/* ==================================================
   HTMLエスケープ
================================================== */

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

})();
