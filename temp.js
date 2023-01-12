var $table = $("#table").bootstrapTable();
var lineIndex = 0;
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
        swal("Atenção!", "Deseja mesmo cancelar a inclusão de um novo registro?", "warning", {
            dangerMode: true,
            buttons: {
                cancel: "Não",
                confirm: {
                    text: "Sim",
                    value: true,
                    visible: true,
                    closeModal: true,
                },
            },
        }).then((value) => {
            switch (value) {
                case true:
                    $("#projeto").val('');
                    $("#atividade").val('');
                    $("#collapseExample").collapse('toggle');
                    break;
                default:
                    swal.close();
            }
        });
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
                let duracao = this.calcularTotal(inicio, fim);
                let total = moment.duration(duracao).asHours();
                ultimo.decimal = fn.horasDecimais(total);
                ultimo.total = ("00" + duracao._data.hours).slice(-2) + ":" + ("00" + duracao._data.minutes).slice(-2);
                this.atualizar(ultimo, 0);
            }
        }
    },

    /**
     * Calcula o tempo de atividade
     * @param {time} inicio : horário de início
     * @param {time} fim : horário de fim
     * @returns duration : duração da atividade
     */
    calcularTotal: function (inicio, fim) {
        return moment.duration(fim.diff(inicio));
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
        swal("Atenção!", "Deseja realmente remover todos os lançamentos?\nEsta operação é irreversível.", "warning", {
            dangerMode: true,
            buttons: {
                cancel: "Cancelar",
                confirm: {
                    text: "Confirmar",
                    value: true,
                    visible: true,
                    closeModal: true,
                },
            },
        }).then((value) => {
            switch (value) {
                case true:
                    localStorage.removeItem('temp');
                    location.reload();
                    break;
                default:
                    swal.close();
            }
        });
    },

    /**
     * Editar lançamento
     * @param {object} row : linha com dados para edição
     * @param {integer} index : índice da linha na tabela
     */
    editar: function (row, index) {
        lineIndex = index;
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
            inicio: this.toMoment($("#edicao_inicio").val()),
            fim: this.toMoment($("#edicao_fim").val()),
            atividade: $("#edicao_atividade").val(),
        }
        let duracao = this.calcularTotal(obj.inicio, obj.fim);
        let total = moment.duration(duracao).asHours();
        obj.decimal = fn.horasDecimais(total);
        obj.total = ("00" + duracao._data.hours).slice(-2) + ":" + ("00" + duracao._data.minutes).slice(-2);
        this.atualizar(obj, lineIndex);
        $("#editModal").modal('hide');
        swal('Pronto!', 'Registro atualizado com sucesso!', 'success', {
            buttons: false,
            timer: 2000,
        });
    },

    /**
     * Remover lançamento da tabela
     * @param {integer} index : índice da linha a ser eremovida
     */
    remover: function (index) {
        swal("Atenção!", "Deseja realmente remover este apontamento?\nEsta operação é irreversível.", "warning", {
            dangerMode: true,
            buttons: {
                cancel: "Cancelar",
                confirm: {
                    text: "Remover",
                    value: true,
                    visible: true,
                    closeModal: true,
                },
            },
        }).then((value) => {
            switch (value) {
                case true:
                    $table.bootstrapTable('remove', {
                        field: '$index',
                        values: [index]
                    });
                    this.armazenar();
                    break;
                default:
                    swal.close();
            }
        });
    },

    /**
     * Converte hora
     * @param {time} hora : converte hora para o formato Moment
     * @returns moment ; valor convertido para Moment JS
     */
    toMoment(hora) {
        let valor = hora.split(":");
        let hh = moment().set('hour', valor[0]);
        let mm = hh.set('minutes', valor[1]);
        var hora = mm;
        return hora;
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
            options += "<a href='#' class='me-3 text-danger' onclick='tempo.parar()' title='Parar'><i class='fas fa-circle-stop'></i></a>";
        } else {
            options += "<a href='#' class='me-3 text-success' onclick='tempo.continuar(" + JSON.stringify(row) + ")' title='Continuar'><i class='fas fa-circle-play'></i></a>";
            options += "<a href='#' class='me-3 text-secondary' onclick='tempo.editar(" + JSON.stringify(row) + "," + index + ")' title='Editar'><i class='fas fa-pen-to-square'></i></a>";
            options += "<a href='#' class='me-3 text-danger' onclick='tempo.remover(" + index + ")' title='Remover'><i class='fas fa-trash-alt'></i></a>";
        }
        return options;
    },
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
                $table.bootstrapTable('showColumn', 'decimal');
                $table.tableExport({
                    format: 'xls',
                    filename: 'Apontamentos',
                    htmlContent: false,
                });
                $table.bootstrapTable('hideColumn', 'decimal');
            },
            attributes: {
                title: 'Exportar para Excel'
            }
        },
        btnCSV: {
            text: 'CSV',
            icon: 'bi-filetype-csv',
            event: function () {
                $table.bootstrapTable('showColumn', 'decimal');
                $table.bootstrapTable('hideColumn', 'acoes');
                $table.tableExport({
                    format: 'csv',
                    filename: 'Apontamentos',
                    htmlContent: false,
                });
                $table.bootstrapTable('hideColumn', 'decimal');
                $table.bootstrapTable('showColumn', 'acoes');
            },
            attributes: {
                title: 'Exportar como CSV'
            }
        },
    }
}

/**
 * Funções gerais
 */
var fn = {

    /**
     * Arredonda horários com divisão de 30 minutos
     * @param {time} hora : horário
     * @returns time round
     */
    horasDecimais(hora) {
        var decimal = hora.toFixed(2);
        var splitTime = decimal.toString().split('.');
        var h = splitTime[0];
        var m = splitTime[1];
        var round = null;
        if (m > 0 && m < 10) {
            round = '00';
        } else if (m >= 11 && m <= 65) {
            round = '50';
        } else if (m >= 66) {
            h++;
            round = '00';
        }
        splitTime[0] = h;
        splitTime[1] = ("00" + round).slice(-2);
        let newTime = splitTime.join(',');
        return newTime;
    }
}