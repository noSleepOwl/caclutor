$(function () {
    const TOTAL = $('#totalMoney'),
        MONTH = $('#month'),
        personNumber = $('#personNumber'),
        remainingMoney = $('#remainingMoney'),
        month_percent = $('#monthPercentRemaining'),
        tbody = $('#tbody'),
        fomat = {notation: 'fixed', precision: 2};

    /**
     * 总金额
     * @returns {number}
     */
    function getTotal() {
        return math.eval(TOTAL.val());
    }

    /**
     * 月份
     * @returns {number}
     */
    function getMonth() {
        return math.eval(MONTH.val());
    }

    /**
     * 人数
     */
    function getPersonNumber() {
        return math.eval(personNumber.val());
    }

    /**
     * 剩余金额
     */
    function getRemain() {
        return math.eval(remainingMoney.val());
    }

    /**
     * 创建表格
     * @param month 月份
     * @param personNumber 人数
     * @returns {string}
     */
    function createTableStr(month, personNumber) {
        let table = '';

        /**
         * 创建第一行
         * @param month
         * @param personInfo
         * @returns {string}
         */
        function createFirstRow(month, personInfo) {
            return `<tr data-month="${month}">
                        <td scope="row" rowspan="${personNumber}">${month}</td>
                        <td data-type="monthPercent" rowspan="${personNumber}"><input type="range" class="form-control" value="0">
                        <span >0</span><span>%</span></td>
                        <td data-type="monthMoney" rowspan="${personNumber}"><span class="mon"></span><span>元</span></td>
                        ${personInfo}
                        <td data-type="personRemainingPercent" rowspan="${personNumber}">100%</td>
                    </tr>`
        }

        /**
         * 创建个人信息
         * @param warp 回掉函数
         * @param index 序号（人的）
         * @returns {string}
         */
        function createPersonInfo(warp, index) {
            if (!index) {
                index = 0;
            }
            let personInfo = `   <td data-type="personIndex">${index}</td>
                        <td data-type="personPercent"><input type="range" class="form-control" value="0"></td>
                        <td data-type="personMoney"><span class="p-money"></span>元</td>`;

            if (warp && typeof warp === 'function') {
                personInfo = warp(personInfo);
            }
            return personInfo;
        }

        /**
         * 创建其他的行
         * @param month
         * @param index
         * @returns {string}
         */
        function createOtherRow(month, index) {
            return createPersonInfo(info => `<tr  data-month="${month}">${info}</tr>>`, index)
        }

        for (let i = 0; i < month; i++) {
            for (let j = 0; j < personNumber; j++) {
                if (j === 0) {
                    table += createFirstRow(i + 1, createPersonInfo(null, j + 1));
                } else {
                    table += createOtherRow(i + 1, j + 1);
                }
            }

        }
        return table;
    }

    /**
     * 设置表格内容
     * @param body
     */
    function setBody(body) {
        tbody.empty();
        tbody.append(body);
    }

    /**
     * 初始化表格内容
     */
    function initInfo() {
        let month = getMonth();
        let person = getPersonNumber();
        if (!person) {
            tbody.empty();
            return;
        }
        let body = createTableStr(month, person);
        setBody(body);
    }


    /**
     * 剩余金额设置
     */
    function setRemainMoney() {
        let chain = math.chain(0);
        $('[data-type="monthPercent"] input').each(function () {
            let val = $(this).val();
            chain = chain.add(val ? val : 0);
        });
        let remining = math.chain(100).subtract(chain.done()).divide(100).multiply(getTotal()).done();
        /*   console.log(getTotal());
           let remining = math
               .chain(getTotal())
               .subtract(chain.done()).done();*/
        remainingMoney.val(remining);
    }

    /**
     * 设置指定月份钱数
     * @param self
     */
    function setMonthMoney(self) {
        let thisInputPercent = $(self).val();
        let money = math
            .chain(math.eval(thisInputPercent ? thisInputPercent : 0))
            .divide(100)
            .multiply(getTotal())
            .format(fomat);
        $(self)
            .parents('tr:eq(0)')
            .find('[data-type="monthMoney"]')
            .find('.mon')
            .text(money + "");
    }

    /**
     * 滑块分组改变函数
     * @param self
     * @param selector
     * @param back
     */
    function rangeGroupChange(self, selector, back) {

        let total = 0;
        $(selector).each(function () {
            let $this = $(this),
                cur = math.eval($this.val() ? $this.val() : 0);
            total += cur;
        });
        let remains = math.chain(100).subtract(total).done();
        $(selector).not(self).each(function () {
            let $this = $(this), cur = math.eval($this.val() ? $this.val() : 0);
            $this.attr('max', math.chain(cur).add(remains));
        });

        if (back && typeof back === 'function') {
            back(remains)
        }
    }

    /**
     * 个人统计数据更新
     * @param self
     */
    function personMoneyChange(self) {
        let month = $(self).parents('tr:eq(0)').data('month');
        let monthMoney = $(`[data-month=${month}]`).find('.mon').text();
        monthMoney = parseFloat(monthMoney ? monthMoney : 0);
        let val = $(self).val();
        let selfPercent = math.chain(val).divide(100).multiply(monthMoney).format(fomat);
        $(self).parents('td:eq(0)').next('td').find('.p-money').text(selfPercent+"");
    }

    /**
     * 更改所有的人数据
     */
    function changeAllPersonPersent() {
        $('[data-month]').find('[data-type="personPercent"] input').each(function () {
            personMoneyChange(this);
        })
    }

    function monthPercent() {
        let all = math.chain(0);
        $('[data-type="monthPercent"] input').each(function () {
            let percent = math.eval($(this).val());
            all = all.add(percent);
        });
        month_percent.val(all.done());
    }

    /**
     * 输入月份和人数的时候
     */
    $('body').on('input', '#personNumber,#month', initInfo)
        .on('input', '#totalMoney', function () {
            setRemainMoney();
            $('[data-type="monthPercent"] input').each(function () {
                setMonthMoney(this);
            })
            changeAllPersonPersent();
            /**
             * 月度比例更改
             */
        }).on('input', '[data-type="monthPercent"] input', function (e) {
        setRemainMoney();
        $(this).next('span:eq(0)').text($(this).val());
        setMonthMoney(this);
        rangeGroupChange(this, '[data-type="monthPercent"] input');
        changeAllPersonPersent();
        monthPercent();
        /**
         * 人度比例更改
         */
    }).on('input', '[data-type="personPercent"] input', function (e) {
        let month = $(this).parents('tr:eq(0)').data('month');
        let monS = `[data-month=${month}]`;
        personMoneyChange(this);
        rangeGroupChange(this,
            `${monS} [data-type="personPercent"] input`,
            function (remains) {
                $(`${monS} [data-type="personRemainingPercent"]`).text(remains + '%')
            })
    });

});