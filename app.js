const banks = {
    "vit": {name: "HOANG DUC VIET", bank: "tpbank", number: "0399767192"},
}

document.addEventListener('DOMContentLoaded', function() {
    const spendingList = document.getElementById('spendingList');
    const summaryContent = document.getElementById('summaryContent');
    const addPersonBtn = document.getElementById('addPersonBtn');
    const resetBtn = document.getElementById('resetBtn');
    const inputDialog = document.getElementById('inputDialog');
    const cancelBtn = document.getElementById('cancelBtn');
    const payBtn = document.getElementById('payBtn');
    const clearBtn = document.getElementById('clearBtn');
    const personInput = document.getElementById('personInput');
    const totalAmountElem = document.querySelector('.total-amount');
    let currentAmount = 0;
    let editPerson = null;

    function loadSpending() {
        const spending = JSON.parse(localStorage.getItem('spending') || '{}');
        spendingList.innerHTML = '';
        let total = 0;

        for (const [name, amount] of Object.entries(spending)) {
            total += amount;
            const spendingItem = document.createElement('tr');
            spendingItem.className = 'spending-item';
            spendingItem.innerHTML = `
                <td>${name}</td>
                <td style="text-align: right">${(amount / 1000).toFixed(0)}k</td>
                <td class="amount-buttons">
                    <button class="add-btn" style="width: 40px;">+</button>
                    <button class="qr-btn" style="width: 40px;">QR</button>
                    <button class="remove-btn" style="width: 40px;">X</button>
                </td>
            `;
            
            spendingItem.querySelector('.add-btn').addEventListener('click', () => {
                openDialog(name);
            });

            spendingItem.querySelector('.qr-btn').addEventListener('click', () => {
                normalizedName = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const bankInfo = banks[normalizedName];
                if (!bankInfo) {
                    alert('Bank information not found.');
                    return;
                }
                document.getElementById('qrImage').src = `https://img.vietqr.io/image/${bankInfo.bank}-${bankInfo.number}-compact2.jpg?amount=${amount}&addInfo=dong%20gop%20quy%20cuu%20doi&accountName=${bankInfo.name}`;
                document.getElementById('qrDialog').showModal();
            });
            
            spendingItem.querySelector('.remove-btn').addEventListener('click', () => {
                if (confirm(`Sút đít ${name}?`)) {
                    removePerson(name);
                }
            });
            
            spendingList.appendChild(spendingItem);
            
        }

        const totalDiv = document.createElement('tr');
        totalDiv.className = 'total';
        totalDiv.innerHTML = `<td>Tổng</td><td style="text-align: right">${(total / 1000).toFixed(0)}k</td><td><button style="opacity: 0"/></td>`;
        spendingList.appendChild(totalDiv);

        updateSummary();
    }

    document.getElementById('qrImage').addEventListener('click', () => {
        document.getElementById('qrDialog').close();
    });

    function updateSummary() {
        const spending = JSON.parse(localStorage.getItem('spending') || '{}');
        const averagePayment = Object.values(spending).reduce((a, b) => a + b, 0) / Object.keys(spending).length;
        let summary = '';

        for (const [name, amount] of Object.entries(spending)) {
            const balance = amount - averagePayment;
            if (balance < 0) {
                for (const [creditor, creditorAmount] of Object.entries(spending)) {
                    const creditorBalance = creditorAmount - averagePayment;
                    if (creditorBalance > 0) {
                        const amountOwed = Math.min(-balance, creditorBalance);
                        if (amountOwed > 0) {
                            summary += `${name} nợ ${creditor} ${(amountOwed / 1000).toFixed(0)}k<br>`;
                            spending[name] += amountOwed;
                            spending[creditor] -= amountOwed;
                        }
                    }
                }
            }
        }

        summaryContent.innerHTML = summary;
    }

    const openDialog = (name = '') => {
        editPerson = name;
        personInput.value = name;
        currentAmount = 0;
        updateTotalAmount();
        inputDialog.showModal();
    };

    const closeDialog = () => {
        inputDialog.close();
        editPerson = null;
    };

    function removePerson(name) {
        const spending = JSON.parse(localStorage.getItem('spending') || '{}');
        delete spending[name];
        localStorage.setItem('spending', JSON.stringify(spending));
        loadSpending();
    }

    const updateTotalAmount = () => {
        totalAmountElem.textContent = `=${(currentAmount / 1000).toFixed(0)}k`;
    };

    document.querySelectorAll('.amount-btn').forEach(button => {
        button.addEventListener('click', () => {
            currentAmount += parseInt(button.dataset.amount);
            updateTotalAmount();
        });
    });

    addPersonBtn.addEventListener('click', () => openDialog());
    cancelBtn.addEventListener('click', closeDialog);
    clearBtn.addEventListener('click', () => {
        currentAmount = 0;
        updateTotalAmount();
    });

    payBtn.addEventListener('click', () => {
        const person = personInput.value.trim();
        if (person) {
            const spending = JSON.parse(localStorage.getItem('spending') || '{}');
            spending[person] = (spending[person] || 0) + currentAmount;
            localStorage.setItem('spending', JSON.stringify(spending));
            loadSpending();
            closeDialog();
            currentAmount = 0;
            updateTotalAmount();
        }
    });

    resetBtn.addEventListener('click', () => {
        if (confirm('Chắc chứ anh bạn?')) {
            localStorage.clear();
            loadSpending();
        }
    });

    loadSpending();

    function generateTPBankQRCode(amount, accountNumber, accountName, transactionContent) {
        const tpBankQRCodeData = `
            {"bankCode":"TPBank","accountNumber":"${accountNumber}","accountName":"${accountName}","amount":"${amount}","transactionContent":"${transactionContent}"}
        `;
        
        const qrcode = new QRCode(document.getElementById("qrcode"), {
            text: tpBankQRCodeData,
            width: 256,
            height: 256,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }
    
    // Example usage:
    generateTPBankQRCode("1000000", "0399767192", "Hoang Duc Viet", "Tra no com cho");
    
});
