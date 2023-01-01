var $table = $("#table").bootstrapTable();
$(document).ready(function () {
    $table.bootstrapTable('refreshOptions', {
        search: true,
        searchAlign: 'right',
        buttonsToolbar: '#toolbar',
        showButtonText: false,
        showButtonIcons: true,
        buttonsClass: 'outline-secondary',
        classes: 'table table-bordered table-hover',
        buttons: buttons
    });
    let dadosArmazenados = localStorage.getItem('temp');
    if (dadosArmazenados != null || dadosArmazenados != undefined) {
        $table.bootstrapTable({
            data: []
        })
        $table.bootstrapTable('load', JSON.parse(dadosArmazenados));
    }
    $("#data").val(moment().format('YYYY-MM-DD'));
});

var tempo = {

    /**
     * Inserir novo registro na tabela
     * @param {object} registro : dados da linha
     */
    inserir: function (registro) {
        $table.bootstrapTable('insertRow', {
            index: 0,
            row: registro,
        });
        this.armazenar();
    },

    /**
     * Atualizar dados da linha na tabela
     * @param {object} registro : dados da linha
     * @param {integer} index : linha a ser atualizada
     */
    atualizar: function (registro, index) {
        $table.bootstrapTable('updateRow', {
            index: index,
            row: registro,
            replace: false,
        });
        $table.bootstrapTable('refresh');
        this.armazenar();
    },

    /**
     * Adicionar registro e iniciar contador
     */
    adicionar: function () {
        var registro = {
            data: moment($("#data").val()),
            inicio: moment(),
            fim: null,
            total: null,
            projeto: $("#projeto").val(),
            atividade: $("#atividade").val(),
        }
        $("#atividade").val('');
        this.parar();
        this.inserir(registro);
        $("#collapseExample").collapse('toggle');
    },

    /**
     * Cancelar inclusão de novo registro
     */
    cancelar: function () {
        if (confirm("Tem certeza que deseja cancelar a inclusão de um novo lançamento?")) {
            $("#projeto").val('');
            $("#atividade").val('');
            $("#collapseExample").collapse('toggle');
        }
    },

    /**
     * Parar registro de tempo para atividade
     * @param {object} row : linha completa
     * @param {integer} index : índice da linha
     */
    parar: function (row, index) {
        let dados = $table.bootstrapTable('getData');
        if (dados.length > 0) {
            let ultimo = dados[0];
            if (ultimo.fim == null) {
                ultimo.fim = moment();
                let inicio = ultimo.inicio;
                let fim = ultimo.fim;
                let duracao = moment.duration(fim.diff(inicio));
                ultimo.total = ("00" + duracao._data.hours).slice(-2) + ":" + ("00" + duracao._data.minutes).slice(-2);
                this.atualizar(ultimo, 0);
            }
        }
    },

    /**
     * Continuar registro de tempo para atividade em novo registro
     * @param {object} row : linha completa
     * @param {integer} index : índice da linha
     */
    continuar: function (row, index) {
        this.parar();
        row.inicio = moment();
        row.fim = null;
        row.total = null;
        this.inserir(row);
    },

    armazenar: function () {
        let dados = $table.bootstrapTable('getData');
        localStorage.setItem('temp', JSON.stringify(dados));
    },

    limpar: function () {
        if (confirm("Esta operação é irreversível. Tem certeza que deseja limpar todos os registros?")) {
            localStorage.removeItem('temp');
            location.reload();
        }
    }
}

var formatter = {


    data: function (value, row, index) {
        return value != null ? moment(value).format('DD/MM/YYYY') : '-';
    },

    hora: function (value, row, index) {
        return value != null ? moment(value).format('HH:mm') : '-';
    },

    total: function (value, row) {
        return value != '00:00' ? value : "<span class='text-muted'>00:00</span>";
    },

    /**
     * Formata ações dos registros
     * @param {*} value : valor a ser formatado
     * @param {object} row : linha completa
     * @param {integer} index : índice da linha
     */
    acoes: function (value, row, index) {
        let options = "";
        if (row.fim == null) {
            options += "<a href='#' class='me-2 text-danger' onclick='tempo.parar()'>Parar</a>";
        } else {
            options += "<a href='#' class='me-2 text-success' onclick='tempo.continuar(" + JSON.stringify(row) + ")'>Continuar</a>";
        }
        return options;
    },

    padLeft: function (num, size) {
        var s = "000000000" + num;
        return s.substr(s.length - size);
    }
}

function buttons() {
    return {
        btnExcel: {
            text: 'Excel',
            icon: 'bi-file-earmark-excel-fill',
            event: function () {
                $table.tableExport({
                    format: 'xls',
                    fileName: 'Relatorio',
                    htmlContent: false,
                });
            },
            attributes: {
                title: 'Exportar para Excel'
            }
        },
        btnCSV: {
            text: 'CSV',
            icon: 'bi-filetype-csv',
            event: function () {
                $table.tableExport({
                    format: 'csv',
                    fileName: 'Relatorio',
                    htmlContent: false,
                });
            },
            attributes: {
                title: 'Exportar como CSV'
            }
        },
    }
}