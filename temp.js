var $table = $("#table").bootstrapTable();
var lineIndex = 0;
$(document).ready(function () {

    /**
 * Adiciona um asterisco (*) à todos os campos obrigatórios da tela
 */
    $('[required]').each(function () {
        $("label[for='" + $(this).attr('id') + "']").append('<span class="text-danger ml-1 lb-obg"> *</span>')
    })

    // Máscara de campos
    $("input[id*='inicio']").mask('00:00');
    $("input[id*='fim']").mask('00:00');

    // Instancia Tabela
    $table.bootstrapTable('refreshOptions', {
        search: true,
        searchAlign: 'right',
        buttonsToolbar: '#toolbar',
        showButtonText: false,
        showButtonIcons: true,
        buttonsClass: 'light',
        classes: 'table table-hover',
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

    $('select').select2({
        theme: "bootstrap-5",
        width: $(this).data('width') ? $(this).data('width') : $(this).hasClass('w-100') ? '100%' : 'style',
        placeholder: 'Selecione',
    });

    $("#tipo").val('');
    $("#projeto").val('');
});

/**
 * LANÇAMENTOS
 */
var tempo = {

    /**
     * Iniciar novo registro
     */
    novo: function () {
        $("#data").val(moment().format('YYYY-MM-DD'));
        $("#inicio").val(moment().format('HH:mm'));
    },

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
        let form = 'registro'
        let registro = fn.getFormData(form);
        if (fn.validateForm(form)) {
            if (fn.maxDate(registro.data)) {
                registro.inicio = registro.inicio == null ? moment() : this.toMoment(registro.inicio);
                registro.fim = registro.fim != null ? this.toMoment(registro.fim) : null;
                if (registro.inicio != null && registro.fim != null) {
                    let duracao = this.calcularTotal(registro.inicio, registro.fim);
                    let total = moment.duration(duracao).asHours();
                    registro.horas = fn.horasDecimais(total);
                    registro.total = ("00" + duracao._data.hours).slice(-2) + ":" + ("00" + duracao._data.minutes).slice(-2);
                }
                fn.clearForm(form)
                this.parar();
                this.inserir(registro);
                $("#collapseExample").collapse('toggle');
            } else {
                swal('Atenção!', 'A data de apontamento não pode ser superior à data atual.', 'warning');
                fn.setFieldVal('data', '');
                return false;
            }
        } else {
            swal('Ops!', 'Um ou mais campos obrigatórios não foram preenchidos.', 'error');
            return false;
        }
    },

    /**
     * Cancelar inclusão de novo registro
     */
    cancelar: function (form) {
        swal("Atenção!", "Deseja mesmo cancelar esta operação?", "warning", {
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
                    fn.clearForm(form);
                    switch (form) {
                        case 'registro':
                            $("#collapseExample").collapse('toggle');
                            break;
                        case 'edicao':
                            $("#editModal").modal('hide');
                            break;
                    }
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
                ultimo.horas = fn.horasDecimais(total);
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
        $(".search-input").val('');
        $(".search-input").trigger("change");
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
     * Editar lançamento
     * @param {object} row : linha com dados para edição
     * @param {integer} index : índice da linha na tabela
     */
    editar: function (row, index) {
        lineIndex = index;
        fn.setFieldVal('edicao_data', moment(row.data).format('YYYY-MM-DD'));
        fn.setFieldVal('edicao_inicio', moment(row.inicio).format('HH:mm'));
        fn.setFieldVal('edicao_fim', moment(row.fim).format('HH:mm'));
        fn.setFieldVal('edicao_tipo', row.tipo);
        fn.setFieldVal('edicao_projeto', row.projeto);
        fn.setFieldVal('edicao_classe', row.classe);
        fn.setFieldVal('edicao_atividade', row.atividade);
        $("#editModal").modal('show');
    },

    /**
     * Salvar alterações da edição do registro
     */
    salvar: function () {
        let form = 'edicao';
        let formData = fn.getFormData(form);
        if (fn.validateForm(form)) {
            let registro = {
                data: formData.edicao_data,
                inicio: this.toMoment(formData.edicao_inicio),
                fim: this.toMoment(formData.edicao_fim),
                tipo: formData.edicao_tipo,
                projeto: formData.edicao_projeto,
                classe: formData.edicao_classe,
                atividade: formData.edicao_atividade,
            }
            if (fn.maxDate(registro.data)) {
                let duracao = this.calcularTotal(registro.inicio, registro.fim);
                let total = moment.duration(duracao).asHours();
                registro.horas = fn.horasDecimais(total);
                registro.total = ("00" + duracao._data.hours).slice(-2) + ":" + ("00" + duracao._data.minutes).slice(-2);
                fn.clearForm(form);
                this.atualizar(registro, lineIndex);
                $("#editModal").modal('hide');
                swal('Pronto!', 'Registro atualizado com sucesso!', 'success', {
                    buttons: false,
                    timer: 2000,
                });
            } else {
                swal('Atenção!', 'A data de apontamento não pode ser superior à data atual.', 'warning');
                fn.setFieldVal('edicao_data', '');
                return false;
            }
        } else {
            swal('Ops!', 'Um ou mais campos obrigatórios não foram preenchidos.', 'error');
            return false;
        }
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
    },
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
                $table.bootstrapTable('showColumn', 'tipo');
                $table.bootstrapTable('showColumn', 'horas');
                $table.bootstrapTable('hideColumn', 'acoes');
                $table.tableExport({
                    format: 'xls',
                    filename: 'Apontamentos',
                    htmlContent: false,
                });
                $table.bootstrapTable('hideColumn', 'tipo');
                $table.bootstrapTable('hideColumn', 'horas');
                $table.bootstrapTable('showColumn', 'acoes');
            },
            attributes: {
                title: 'Exportar para Excel'
            }
        },
        btnCSV: {
            text: 'CSV',
            icon: 'bi-filetype-csv',
            event: function () {
                $table.bootstrapTable('refreshOptions', { pagination: false });
                $table.bootstrapTable('showColumn', 'tipo');
                $table.bootstrapTable('showColumn', 'horas');
                $table.bootstrapTable('hideColumn', 'acoes');
                $table.tableExport({
                    format: 'csv',
                    filename: 'Apontamentos',
                    htmlContent: false,
                });
                $table.bootstrapTable('hideColumn', 'tipo');
                $table.bootstrapTable('hideColumn', 'horas');
                $table.bootstrapTable('showColumn', 'acoes');
                $table.bootstrapTable('refreshOptions', { pagination: true });
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
    },

    /**
     * Recupera todos os dados de um formulário
     * @returns {obj} dados : todos os dados do formulário
     */
    getFormData: function (form) {
        var oDados = {}
        $("input, select, textarea").each(function () {
            if ($(this).data('form') == form) {
                let oInput = $(this)
                let sAttr = $(this).attr('id')
                let uVal = $(this).val()
                if (uVal != '') {
                    switch (oInput[0].type) {

                        // Campo do tipo Checkbox
                        case 'checkbox':
                            if ($(this).is(':checked')) {
                                oDados[sAttr] = uVal
                            }
                            break;

                        // Campo do tipo Radio
                        case 'radio':
                            if ($(this).is(':checked')) {
                                oDados[$(this).attr('name')] = uVal
                            }
                            break;

                        default:
                            // Verifica se é um Select multiplo
                            if (oInput[0].tagName == 'SELECT' && oInput[0].multiple == true) {
                                oDados[sAttr] = uVal
                                oDados[sAttr.substr(3)] = field.getMultiSelectText(sAttr)
                            } else {
                                // Verifica se é um campo Select
                                if (oInput[0].tagName == 'SELECT') {
                                    // Captura valor
                                    oDados[sAttr] = !isNaN(uVal) ? parseInt(uVal) : uVal
                                    if (sAttr.substr(0, 3) == "ID_") {
                                        oDados[sAttr.substr(3)] = field.getSelectText(sAttr)
                                    }
                                } else {
                                    // Verifica se é um campo decimal
                                    if (!oInput.hasClass('decimal')) {
                                        // Campos Padrão
                                        oDados[sAttr] = uVal
                                    } else {
                                        // Campo Decimal
                                        oDados[sAttr] = convertions.toFloat(uVal)
                                    }
                                }
                            }
                            break;
                    }
                }
            }
        })
        // Retorna os dados do formulário
        return oDados
    },

    /**
     * Limpar Formulário
     * @param {str} form : nome do formulário
     */
    clearForm: function (form) {
        $("[data-form='" + form + "']").each(function () {
            let oField = $(this)
            let sType = oField[0].tagName
            switch (sType) {
                case 'INPUT':
                    let sInputType = oField[0].attributes.type.nodeValue
                    if (sInputType != 'radio' && sInputType != 'checkbox') {
                        $(this).val(null)
                        $(this).removeClass('border border-danger')
                    } else {
                        $(this).prop('checked', false)
                    }
                    break;
                case 'SELECT':
                    $(this).next('span').children('.selection').children('.select2-container--bootstrap-5 .select2-selection').css('border', '1px solid #ced4da');
                    $(this).select2('val', '');
                    break;
                case 'SPAN':
                    $(this).html(null)
                    break;
                case 'TEXTAREA':
                    $(this).val(null)
                    break;
            }
        });
    },

    /**
     * Captura valor do campo ou elemento
     * @param {str} field : nome do campo
     * @returns
     */
    getFieldVal: function (field) {
        let oField = $("#" + field)
        let sType = oField[0].tagName
        let val = null
        switch (sType) {
            case 'SPAN':
                val = $("#" + field).html()
                break;
            default:
                if ($("#" + field).hasClass('decimal')) {
                    val = convertions.toFloat($("#" + field).val())
                } else {
                    if (sType == 'RADIO') {
                        $("input[name='" + field + "']").val();
                    } else {
                        val = $("#" + field).val()
                    }
                }
                break;
        }
        return val
    },

    /**
     * Define valor do campo ou elemento
     * @param {str} field : nome do campo
     * @param {*} value : valor do campo
     */
    setFieldVal: function (field, value) {
        let oField = $("#" + field)
        let sType = oField[0].tagName
        switch (sType) {

            // Campo Padrão
            case 'INPUT':
                $("#" + field).val(value)
                break;

            // TextArea
            case 'TEXTAREA':
                $("#" + field).val(value)
                break;

            // Campo DropDown
            case 'SELECT':
                setTimeout(function () {
                    $("#" + field).val(value)
                    $("#" + field).trigger('change')
                }, 100)
                break;

            // Elemento Span
            case 'SPAN':
                $("#" + field).html(value)
                break;
        }
    },

    maxDate(date) {
        var dataAtual = moment();
        var dataInformada = moment(date);
        var diferenca = dataInformada.diff(dataAtual) // 1
        return diferenca > 0 ? false : true;
    },

    /**
     * Valida preenchimento de campos obrigatórios em formulários de subcadastro
     * @param {str} form : nome do formulário a validar
     */
    validateForm: function (form) {
        let val = false;
        let campos = new Array()

        // Percorre todos os campos com propriedade REQUIRED
        $('[required]').each(function () {
            // Verifica o campo e formulário a ser validado
            if ($(this).attr('id') && $(this).data('form') == form) {
                // Adiciona campo à lista dos obrigatórios
                campos.push($(this).attr('id'))
            }
        })

        // Percorre todos os campos identificados
        for (c = 0; c < campos.length; c++) {
            // Captura tipo do campo
            let sType = $("#" + campos[c])[0].tagName
            // Verifica se campo está em branco
            if ($("#" + campos[c]).val() == "" || ($("#" + campos[c]).val() == null)) {
                if (sType == 'SELECT') {
                    $('#' + campos[c]).next('span').children('.selection').children('.select2-container--bootstrap-5 .select2-selection').css('border', '1px solid rgb(220,53,69)');
                } else {
                    $("#" + campos[c]).addClass('border border-danger')
                    val = true
                }
                console.error($("#" + campos[c]).attr('id'))
            } else {
                if (sType == 'SELECT') {
                    $('#' + campos[c]).next('span').children('.selection').children('.select2-container--bootstrap-5 .select2-selection').css('border', '1px solid #ced4da');
                } else {
                    $("#" + campos[c]).removeClass('border border-danger')
                }
            }
        }

        // Verifica se há campos obrigatórios não preenchidos
        if (val == true) {
            return false
        } else {
            return true
        }
    },
}