var $table = $("#table").bootstrapTable();
$(document).ready(function () {
    $table.bootstrapTable('refreshOptions', {
        search: true,
        searchAlign: 'right',
        buttonsToolbar: '#toolbar',
        showButtonText: false,
        showButtonIcons: true,
        buttonsClass: 'light',
        classes: 'table table-bordered table-hover',
        buttons: buttons,
        pagination: true,
        pageSize: 15
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

/**
 * LANÇAMENTOS
 */
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
        row.data = moment().format('YYYY-MM-DD');
        row.inicio = moment();
        row.fim = null;
        row.total = null;
        this.inserir(row);
    },

    /**
     * Armazenar todos os dados registrados
     */
    armazenar: function () {
        let dados = $table.bootstrapTable('getData');
        localStorage.setItem('temp', JSON.stringify(dados));
    },

    /**
     * Eliminar todos os registros disponíveis
     */
    limpar: function () {
        if (confirm("Esta operação é irreversível. Tem certeza que deseja limpar todos os registros?")) {
            localStorage.removeItem('temp');
            location.reload();
        }
    },

    /**
     * Editar lançamento
     * @param {object} row : linha com dados para edição
     * @param {integer} index : índice da linha na tabela
     */
    editar: function (row, index) {
        $("#editModal").modal('show');
        $("#edicao_data").val(moment(row.data).format('YYYY-MM-DD'));
        $("#edicao_projeto").val(row.projeto)
        $("#edicao_inicio").val(moment(row.inicio).format('HH:mm'))
        $("#edicao_fim").val(moment(row.fim).format("HH:mm"));
        $("#edicao_atividade").val(row.atividade)
    },

    /**
     * Salvar alterações da edição do registro
     */
    salvar: function () {
        let obj = {
            data: $("#edicao_data").val(),
            projeto: $("#edicao_projeto").val(),
            inicio: $("#edicao_inicio").val(),
            fim: $("#edicao_fim").val(),
            atividade: $("#edicao_atividade").val(),
        }
        this.atualizar(obj, index);
    }
}

/**
 * FORMATAÇÕES
 */
var formatter = {

    /**
     * Formata Data
     * @param {date} value : valor a ser formatado
     * @param {object} row : linha completa
     * @param {integer} index : índice da linha na tabela
     * @returns date
     */
    data: function (value, row, index) {
        return value != null ? moment(value).format('DD/MM/YYYY') : '-';
    },

    /**
     * Formata Hora
     * @param {date} value : valor a ser formatado
     * @param {object} row : linha completa
     * @param {integer} index : índice da linha na tabela
     * @returns time
     */
    hora: function (value, row, index) {
        return value != null ? moment(value).format('HH:mm') : '-';
    },

    /**
     * Formata total de horas
     * @param {date} value : valor a ser formatado
     * @param {object} row : linha completa
     * @param {integer} index : índice da linha na tabela
     * @returns duration
     */
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
            options += "<a href='#' class='me-2 text-danger' onclick='tempo.parar()' title='Parar'><i class='fas fa-circle-stop me-2'></i></a>";
        } else {
            options += "<a href='#' class='me-2 text-success' onclick='tempo.continuar(" + JSON.stringify(row) + ")' title='Continuar'><i class='fas fa-circle-play me-2'></i></a>";
            options += "<a href='#' class='me-2 text-primary' onclick='tempo.editar(" + JSON.stringify(row) + "," + index + ")' title='Editar'><i class='fas fa-square-pen me-2'></i></a>";
        }
        return options;
    },

    /**
     * Formata número com zeros à esquerda
     * @param {integer} num : valor a ser formatado
     * @param {integer} size : número de zeros à esquerda
     * @returns string
     */
    padLeft: function (num, size) {
        var s = "000000000" + num;
        return s.substr(s.length - size);
    }
}

/**
 * Botões de exportação de dados
 * @returns functions
 */
function buttons() {
    return {
        btnExcel: {
            text: 'Excel',
            icon: 'bi-file-earmark-excel-fill',
            event: function () {
                $table.tableExport({
                    format: 'xls',
                    filename: 'Apontamentos',
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
                    filename: 'Apontamentos',
                    htmlContent: false,
                });
            },
            attributes: {
                title: 'Exportar como CSV'
            }
        },
    }
}