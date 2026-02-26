var _menu = {
	bar: [
		{
			nome: "Acqua",
			gruppo: "bar",
			prezzo: 1.00
		},/*
{
			nome: "Red Bull",
			gruppo: "bar",
			prezzo: 2.50
		},*/
		{
			nome: "Vino bottiglia bianco o rosso",
			gruppo: "bar",
			prezzo: 10
		},
{
			nome: "Vino bottiglia spumantino",
			gruppo: "bar",
			prezzo: 12
		},
		{
			nome: "Vino bicchiere",
			gruppo: "bar",
			prezzo: 1
		},
		{
			nome: "Caffe",
			gruppo: "bar",
			prezzo: 1
		},
		{
			nome: "Amaro",
			gruppo: "bar",
			prezzo: 2.50
		},
		{
			nome: "Torta",
			gruppo: "secondi",
			prezzo: 1.5
		},
		{
			nome: "Birra",
			gruppo: "bar",
			prezzo: 2.5
		},
		{
			nome: "Bibita",
			gruppo: "bar",
			prezzo: 2.5
		},
		/*{
			nome: "Bicchiere Valmo Festival",
			gruppo: "bar",
			prezzo: 1,
			stampa: false
		},*/

	],
	primi: [
		/*{
			nome: "Gnocchi ragu",
			gruppo: "primi",
			prezzo: 4
		},
		{
			nome: "Gnocchi pomodoro",
			gruppo: "primi",
			prezzo: 3.5
		},
		{
			nome: "Gnocchi boscaiola",
			gruppo: "primi",
			prezzo: 4.5
		},
		{
			nome: "Gnocchi zola salsiccia",
			gruppo: "primi",
			prezzo: 4.5
		},
		
		{
			nome: "Gnocchi burro salvia",
			gruppo: "primi",
			prezzo: 3.5
		},
        {
			nome: "Gnocchi radicchio e zola",
			gruppo: "primi",
			prezzo: 4.5
		},
		/*	
		{
			nome: "Trippa",
			gruppo: "primi",
			prezzo: 4.5
		},
		
		{
			nome: "Fetta zola",
			gruppo: "primi",
			prezzo: 2.0
		},	
		{
			nome: "Zuppa di cipolle in pagnottella",
			gruppo: "primi",
			prezzo: 5
		},

		
		{
			nome: "Quaglie ripiene con polenta",
			gruppo: "primi",
			prezzo: 7
		},
        {
			nome: "Polenta e zola",
			gruppo: "primi",
			prezzo: 4
		},
        {
			nome: "Polenta e sughi",
			gruppo: "primi",
			prezzo: 4
		},
		
        {
			nome: "Pasta ragu",
			gruppo: "primi",
			prezzo: 3.5
		},

        {
			nome: "Pasta sugo",
			gruppo: "primi",
			prezzo: 3
		},*/
	],
	secondi: [
		/*{
			nome: "Costine",
			gruppo: "secondi",
			prezzo: 5
		},
		{
			nome: "Grigliata",
			gruppo: "secondi",
			prezzo: 8
		},*/
        	{
			nome: "Alborelle",
			gruppo: "secondi veloci",
			prezzo: 8
		},
		{
			nome: "Porchetta con contorno",
			gruppo: "secondi veloci",
			prezzo: 9
		},
		{
			nome: "Salamella con patatine",
			gruppo: "secondi veloci",
			prezzo: 5
		},
		{
			nome: "Panino salamella",
			gruppo: "secondi veloci",
			prezzo: 3.5
		},
		{
			nome: "Patatine",
			gruppo: "secondi veloci",
			prezzo: 2.5
		},/*
        {
			nome: "Roast beef",
			gruppo: "secondi veloci",
			prezzo: 4
		},
        {
			nome: "Tomino",
			gruppo: "secondi",
			prezzo: 2
		},
        {
			nome: "Pollo",
			gruppo: "secondi",
			prezzo: 4
		},
		{
			nome: "Tomino + asparagi",
			gruppo: "secondi",
			prezzo: 4
		},*//*
        {
			nome: "Fagioli",
			gruppo: "secondi veloci",
			prezzo: 2
		},
        {
			nome: "Fagioli + cipolle",
			gruppo: "secondi veloci",
			prezzo: 2
		},
		/*
	
		
		
        {
			nome: "Fanta Insalata",
			gruppo: "secondi veloci",
			prezzo: 3
		},*/
		
	]
};


localStorage.setItem('menu', JSON.stringify(_menu));

