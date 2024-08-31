let spending = JSON.parse(localStorage.getItem('spending')) || {
    "vit": {amount: 0, bank: "tpbank", accountNumber: "0399767192"},
};

document.addEventListener('DOMContentLoaded', function() {
    const getId = document.getElementById.bind(document);
    const spendingList = getId('spendingList');
    const summaryContent = getId('summaryContent');
    const addPersonBtn = getId('addPersonBtn');
    const resetBtn = getId('resetBtn');
    const inputDialog = getId('inputDialog');
    const cancelBtn = getId('cancelBtn');
    const payBtn = getId('payBtn');
    const clearBtn = getId('clearBtn');
    const personInput = getId('personInput');
    const totalAmountElem = document.querySelector('.total-amount');
    const qrImage = getId('qrImage');
    const qrDialog = getId('qrDialog');
    let currentAmount = 0;

    function loadSpending() {
        spendingList.innerHTML = '';
        let total = Object.values(spending).reduce((a, b) => a + (b.amount || 0), 0);

        console.table(spending)

        for (const [name, person] of Object.entries(spending)) {
            const spendingItem = document.createElement('tr');
            spendingItem.className = 'spending-item';

            console.log(name, person, person.amount, person.amount== true)

            spendingItem.innerHTML = `
                <td>${name}</td>
                <td class="amount">
                <span>${person.amount ? (person.amount / 1000).toFixed(0) : 0}k</span>
                <div class="progress">
                    <div class="fill" style="width: ${person.amount ? (person.amount / total) * 100 : 0}%"></div>
                </div>
                </td>
                <td class="amount-buttons">
                    <button class="add-btn" style="width: 40px;">Chi</button>
                    <button class="remove-btn" style="width: 40px;">X</button>
                </td>
            `;
            
            spendingItem.querySelector('.add-btn').addEventListener('click', () => {
                openDialog(name);
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
        totalDiv.innerHTML = `<td>Tổng</td><td class="amount">${(total / 1000).toFixed(0)}k</td><td><button style="opacity: 0"/></td>`;
        spendingList.appendChild(totalDiv);

        updateSummary();
    }

    async function addBank(name, bankName="", accountNumber="") {
        bankName = prompt('Chưa có thông tin bank nha 😏 Cho xin tên ngân hàng (Viết liền không dấu):', bankName);
        if (bankName === null) return;
        
        // accountName = prompt('Tên tài khoản (Viết hoa không dấu):', accountName);
        // if (accountName === null) return; // User cancelled

        accountNumber = prompt('Số tài khoản:', accountNumber);
        if (accountNumber === null) return;

        try {
            const response = await fetch(`https://img.vietqr.io/image/${bankName}-${name}-compact2.jpg?amount=${10000}&addInfo=dong%20gop%20quy%20cuu%20doi&accountName=${accountNumber}`);
            if (!response.ok) {
                alert('Ngân hàng méo trả lời:', response.ok);
            }

            const contentType = response.headers.get('content-type');

            if (contentType !== 'image/png') {
                const text = await response.text();
                if (text) {
                    if (confirm(`Nhập sai rồi con lợn, ngân hàng nó bảo là ${text}. Nhập lại khum?`)) {
                        return addBank(name, bankName, accountNumber);
                    }
                }
            }
                
            spending[name] = {bank: bankName, accountNumber: accountNumber};
            localStorage.setItem('spending', JSON.stringify(spending));
            return true;
        } catch (error) {
            alert('Lỗi méo gì ấy:', error.message);
        }

        return false;
    }

    qrImage.addEventListener('click', () => {
        qrDialog.close();
    });

    function updateSummary() {
        const averagePayment = Object.values(spending).reduce((a, b) => a + b.amount, 0) / Object.keys(spending).length;
        summaryContent.innerHTML = "";

        for (const [name, person] of Object.entries(spending)) {
            const balance = (person.amount || 0) - averagePayment;
            if (balance > 0) continue;

            for (const [creditor, creditorPerson] of Object.entries(spending)) {
                const creditorBalance = (creditorPerson.amount || 0) - averagePayment;
                if (creditorBalance == 0) continue;

                const amountOwed = Math.min(-balance, creditorBalance);
                if (amountOwed > 0) {
                    const summaryItem = document.createElement('tr');
                    
                    summaryItem.innerHTML = `<tr>
                        <td>${name} nợ ${creditor} ${(amountOwed).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}đ</td>
                        <td class="amount-buttons"><button class="qr-btn" style="width: 40px;">QR</button></td>
                    </tr>`;

                    summaryItem.querySelector('.qr-btn').addEventListener('click', async () => {
                        // normalizedName = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                        let bankInfo = spending[name];
                        
                        if (!bankInfo || !bankInfo.bank) {
                            if (!await addBank(name)) {
                                return;
                            }
                        }
                        
                        bankInfo = spending[name];
                        qrImage.src = `https://img.vietqr.io/image/${bankInfo.bank}-${name}-compact2.jpg?amount=${amountOwed}&addInfo=dong%20gop%20quy%20cuu%20doi&accountName=${bankInfo.accountName}`;
                        qrDialog.showModal();
                    });

                    spending[name].amount += amountOwed;
                    spending[creditor].amount -= amountOwed;

                    summaryContent.appendChild(summaryItem);
                }
            }
        }
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
            if (!spending[person]) spending[person] = { amount: 0 };
            spending[person].amount += currentAmount;
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
});
