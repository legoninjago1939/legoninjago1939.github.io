let inventory = JSON.parse(localStorage.getItem("jdmInventory")) || [];
let chart, pieChart;

document.addEventListener("DOMContentLoaded", function () {

    displayInventory();
    createCharts();
    updateSummaryCards();

    document.getElementById("inventoryForm").addEventListener("submit", function (e) {
        e.preventDefault();

        const itemName = document.getElementById("itemName").value.trim();
        const qtyRaw = document.getElementById("itemQty").value.trim();

        if (!/^\d+$/.test(qtyRaw)) {
            alert("Quantity must be a positive whole number.");
            return;
        }

        const qty = parseInt(qtyRaw);

        if (itemName === "" || qty <= 0) {
            alert("Item name cannot be empty and quantity must be greater than 0.");
            return;
        }

        const existing = inventory.find(i =>
            i.name.toLowerCase() === itemName.toLowerCase()
        );

        if (existing) {
            const confirmAdd = confirm(
                `"${itemName}" already exists with ${existing.quantity} units.\n\n` +
                `Would you like to add ${qty} more units to the existing inventory?`
            );

            if (confirmAdd) {
                existing.quantity += qty;
                alert("Inventory successfully updated.");
            } else {
                alert("No changes were made.");
                return;
            }

        } else {
            inventory.push({ name: itemName, quantity: qty });
        }

        localStorage.setItem("jdmInventory", JSON.stringify(inventory));

        displayInventory();
        updateCharts();
        updateSummaryCards();

        this.reset();
    });

    document.getElementById("clearInventory").addEventListener("click", function () {
        if (confirm("Are you sure you want to clear all inventory?")) {
            inventory = [];
            localStorage.removeItem("jdmInventory");
            displayInventory();
            updateCharts();
            updateSummaryCards();
        }
    });

    const toggleBtn = document.getElementById("toggleChart");
    toggleBtn.addEventListener("click", function() {
        const barCanvas = document.getElementById("inventoryChart");
        const pieCanvas = document.getElementById("inventoryPieChart");

        if (barCanvas.style.display !== "none") {
            barCanvas.style.display = "none";
            pieCanvas.style.display = "block";
            toggleBtn.textContent = "Switch to Bar Chart";
        } else {
            barCanvas.style.display = "block";
            pieCanvas.style.display = "none";
            toggleBtn.textContent = "Switch to Pie Chart";
        }
    });

});

function displayInventory() {
    const list = document.getElementById("inventoryList");
    list.innerHTML = "";

    inventory.forEach(item => {
        const li = document.createElement("li");

        if (item.quantity < 10) {
            li.classList.add("low-stock");
            li.innerHTML = `
                ${item.name} - ${item.quantity} units
                <span class="low-badge">LOW STOCK</span>
            `;
        } else {
            li.textContent = `${item.name} - ${item.quantity} units`;
        }

        list.appendChild(li);
    });
}

function createCharts() {
    const ctx = document.getElementById("inventoryChart").getContext("2d");
    chart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: inventory.map(i => i.name),
            datasets: [{
                label: "Stock Quantity",
                data: inventory.map(i => i.quantity),
                backgroundColor: inventory.map(i =>
                    i.quantity < 10 ? '#ff3b3b' : '#7ec8e3'
                )
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true } }
        }
    });

    const pieCtx = document.getElementById("inventoryPieChart").getContext("2d");
    pieChart = new Chart(pieCtx, {
        type: "pie",
        data: {
            labels: inventory.map(i => i.name),
            datasets: [{
                data: inventory.map(i => i.quantity),
                backgroundColor: [],
                offset: function(context) {
                    // Exploding effect on hover
                    return context.active ? 20 : 0;
                }
            }]
        },
        options: {
            responsive: true,
            plugins: {
                datalabels: {
                    color: '#fff',
                    formatter: (value, context) => {
                        const total = context.chart.data.datasets[0].data.reduce((a,b) => a+b, 0);
                        const percent = ((value / total) * 100).toFixed(1);
                        return percent + '%';
                    },
                    font: {
                        weight: 'bold',
                        size: 14
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });

    updatePieChart();
}

function updateCharts() {
    chart.data.labels = inventory.map(i => i.name);
    chart.data.datasets[0].data = inventory.map(i => i.quantity);
    chart.data.datasets[0].backgroundColor =
        inventory.map(i => i.quantity < 10 ? '#ff3b3b' : '#7ec8e3');
    chart.update();

    updatePieChart();
}

function updatePieChart() {
    if (!pieChart) return;

    const colorPalette = [
        '#7ec8e3','#f8a600','#00ff99','#ff33aa','#9933ff',
        '#33ccff','#ff9933','#33ff66','#ff6666','#cccc33'
    ];

    pieChart.data.labels = inventory.map(i => i.name);
    pieChart.data.datasets[0].data = inventory.map(i => i.quantity);
    pieChart.data.datasets[0].backgroundColor = inventory.map((item, idx) =>
        item.quantity < 10 ? '#ff3b3b' : colorPalette[idx % colorPalette.length]
    );

    pieChart.update();
}

function updateSummaryCards() {
    document.getElementById("totalItemsCard").textContent =
        `Total Items: ${inventory.length}`;

    const totalQty = inventory.reduce((sum, i) => sum + i.quantity, 0);
    document.getElementById("totalQuantityCard").textContent =
        `Total Quantity: ${totalQty}`;

    const lowStock = inventory.filter(i => i.quantity < 10).length;
    const lowCard = document.getElementById("lowStockCard");
    const alertBanner = document.getElementById("lowStockAlert");

    lowCard.textContent = `Low Stock Items: ${lowStock}`;

    if (lowStock > 0) {
        lowCard.style.borderLeft = "5px solid #ff3b3b";
        lowCard.style.color = "#ff3b3b";
        alertBanner.style.display = "block";
    } else {
        lowCard.style.borderLeft = "5px solid #7ec8e3";
        lowCard.style.color = "#e0e0e0";
        alertBanner.style.display = "none";
    }
}