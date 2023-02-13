create table lancamentos (
    id int(11) not null comment 'Código' auto_increment primary key,
    data date not null comment 'Data',
    inicio time not null comment 'Início',
    fim time comment 'Fim',
    projeto varchar(25) not null comment 'Projeto',
    classe varchar(50) not null comment 'Classificação',
    atividade varchar(100) not null comment 'Atividade',
    horas decimal(10,2) comment 'Total'
)