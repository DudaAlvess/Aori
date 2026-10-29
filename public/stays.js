// Seleção editorial fictícia para revisão. Fotografias, preços e comodidades são ilustrativos.
export const stays = [
  {
    id: 'casa-do-horizonte', name: 'Casa do Horizonte', destination: 'serra',
    location: 'Urubici, SC', regionLabel: 'Serra catarinense', propertyType: 'Casa inteira',
    photo: '/assets/photos/stay-bedroom.jpg',
    photoAlt: 'Fotografia ilustrativa de um quarto acolhedor com madeira e luz natural',
    gallery: [
      { src: '/assets/photos/stay-bedroom.jpg', alt: 'Quarto de madeira e tecidos claros, em fotografia ilustrativa' },
      { src: '/assets/photos/stay-cabin.jpg', alt: 'Cabana cercada por natureza, em fotografia ilustrativa' },
      { src: '/assets/photos/brazil-mountains.jpg', alt: 'Paisagem verde de montanhas, em fotografia ilustrativa' }
    ],
    tag: 'Um respiro na serra', guests: 2, bedrooms: 1, bathrooms: 1, price: 740,
    filters: ['natureza', 'design', 'a-dois'],
    description: 'Luz entrando devagar, uma vista que convida a ficar.',
    amenities: ['Vista para as montanhas', 'Lareira', 'Cozinha equipada', 'Varanda privativa'],
    story: 'Um refúgio imaginado em Urubici para os dias sem pressa. Entre a madeira, as texturas naturais e a paisagem, há espaço para ler, cozinhar e simplesmente estar.',
    longDescription: [
      'A Casa do Horizonte foi imaginada como uma pausa a dois na serra catarinense. Madeira, linho e luz natural dão forma a um ambiente que acolhe desde o primeiro café do dia.',
      'Nesta proposta demonstrativa, a varanda convida a olhar a paisagem, a cozinha permite preparar uma refeição sem pressa e a lareira acompanha uma noite de conversa. Os espaços e as comodidades são exemplos para você conhecer a experiência Aori.'
    ],
    locationDescription: 'Urubici é o cenário catarinense escolhido para esta casa fictícia. A proposta é imaginar uma estadia voltada ao silêncio, aos encontros e ao tempo ao ar livre. Não há endereço real associado a este anúncio demonstrativo.',
    rules: ['Entrada a partir das 15h', 'Saída até as 11h', 'Até 2 hóspedes', 'Não fumar nos ambientes internos', 'Respeitar o silêncio à noite']
  },
  {
    id: 'casa-entre-mares', name: 'Casa entre Marés', destination: 'praia',
    location: 'Bombinhas, SC', regionLabel: 'Litoral catarinense', propertyType: 'Casa inteira',
    photo: '/assets/photos/stay-villa.jpg',
    photoAlt: 'Fotografia ilustrativa de uma hospedagem com piscina e áreas abertas',
    gallery: [
      { src: '/assets/photos/stay-villa.jpg', alt: 'Hospedagem com piscina, em fotografia ilustrativa' },
      { src: '/assets/photos/hero-pool.jpg', alt: 'Área de descanso junto à piscina, em fotografia ilustrativa' },
      { src: '/assets/photos/brazil-coast.jpg', alt: 'Paisagem de praia e vegetação, em fotografia ilustrativa' }
    ],
    tag: 'Perto do mar', guests: 4, bedrooms: 2, bathrooms: 2, price: 980,
    filters: ['natureza', 'familia'],
    description: 'O verde abraça a casa. O mar dita o ritmo.',
    amenities: ['Jardim tropical', 'Piscina', 'Cozinha equipada', 'Espaço para a família'],
    story: 'Uma casa de férias imaginada em Bombinhas. Espaços abertos e encontros à mesa fazem parte da experiência que esta seleção demonstra.',
    longDescription: [
      'A Casa entre Marés é uma proposta de casa de férias em Bombinhas, para dividir os dias de descanso com quem faz bem. Os ambientes imaginados se abrem para um jardim e para o convívio ao ar livre.',
      'Do café da manhã à última conversa da noite, a ideia é ter espaço para estar junto e também para descansar. Piscina, cozinha e dois quartos compõem este exemplo de hospedagem; as fotografias são referências ilustrativas.'
    ],
    locationDescription: 'Bombinhas é o cenário do litoral catarinense escolhido para esta hospedagem fictícia. A inspiração é uma viagem com dias de sol e pausas em boa companhia. Esta prévia não apresenta endereço ou distância real até a praia.',
    rules: ['Entrada a partir das 15h', 'Saída até as 11h', 'Até 4 hóspedes', 'Não fumar nos ambientes internos', 'Crianças na piscina devem estar acompanhadas']
  },
  {
    id: 'cabana-do-alto', name: 'Cabana do Alto', destination: 'serra',
    location: 'São Joaquim, SC', regionLabel: 'Serra catarinense', propertyType: 'Cabana inteira',
    photo: '/assets/photos/stay-cabin.jpg',
    photoAlt: 'Fotografia ilustrativa de uma cabana em uma paisagem tranquila',
    gallery: [
      { src: '/assets/photos/stay-cabin.jpg', alt: 'Cabana em uma paisagem tranquila, em fotografia ilustrativa' },
      { src: '/assets/photos/stay-bedroom.jpg', alt: 'Quarto acolhedor de madeira, em fotografia ilustrativa' },
      { src: '/assets/photos/brazil-mountains.jpg', alt: 'Paisagem de montanhas e natureza, em fotografia ilustrativa' }
    ],
    tag: 'A dois, sem pressa', guests: 2, bedrooms: 1, bathrooms: 1, price: 620,
    filters: ['natureza', 'a-dois'],
    description: 'Uma cabana, um café e todo o tempo do mundo.',
    amenities: ['Vista para a natureza', 'Lareira', 'Cafeteira', 'Deck privativo'],
    story: 'Uma cabana demonstrativa imaginada em São Joaquim: pequena, acolhedora e pensada para deixar a paisagem entrar e compartilhar uma pausa.',
    longDescription: [
      'A Cabana do Alto é um refúgio fictício para dois, inspirado em uma pausa na serra catarinense. O desenho da experiência coloca o descanso no centro: uma janela aberta para a paisagem, café fresco e um canto para ler.',
      'O deck e a lareira fazem parte desta proposta demonstrativa. Aqui, a intenção é ajudar você a imaginar uma estadia aconchegante; fotografias, espaços e comodidades não correspondem a uma oferta real de reserva.'
    ],
    locationDescription: 'São Joaquim é o cenário escolhido para esta cabana fictícia em Santa Catarina. A proposta é uma experiência de serra, acolhimento e contemplação. Nenhuma localização exata ou rota real é apresentada nesta seleção.',
    rules: ['Entrada a partir das 15h', 'Saída até as 11h', 'Até 2 hóspedes', 'Não fumar nos ambientes internos', 'Utilizar a lareira com cuidado']
  },
  {
    id: 'pouso-do-rosa', name: 'Pouso do Rosa', destination: 'praia',
    location: 'Praia do Rosa · Imbituba, SC', regionLabel: 'Litoral catarinense', propertyType: 'Casa inteira',
    photo: '/assets/photos/hero-pool.jpg',
    photoAlt: 'Fotografia ilustrativa de uma área de descanso com piscina e vegetação',
    gallery: [
      { src: '/assets/photos/hero-pool.jpg', alt: 'Área de descanso com piscina, em fotografia ilustrativa' },
      { src: '/assets/photos/stay-villa.jpg', alt: 'Ambientes de uma hospedagem com jardim, em fotografia ilustrativa' },
      { src: '/assets/photos/brazil-coast.jpg', alt: 'Praia e paisagem natural, em fotografia ilustrativa' }
    ],
    tag: 'Dias de sol', guests: 4, bedrooms: 2, bathrooms: 2, price: 890,
    filters: ['design', 'familia'],
    description: 'Leveza por dentro. Natureza por todos os lados.',
    amenities: ['Ambientes integrados', 'Varanda', 'Cozinha equipada', 'Estacionamento'],
    story: 'Um pouso imaginado na Praia do Rosa, em Imbituba, para voltar do passeio e continuar ao ar livre. Tons claros e espaços de convivência dão o tom desta experiência demonstrativa.',
    longDescription: [
      'O Pouso do Rosa foi imaginado para encontros leves no litoral catarinense. Uma casa para compartilhar refeições, voltar de um passeio e encontrar um cantinho de descanso ao ar livre.',
      'A composição demonstrativa reúne dois quartos, cozinha e varanda, com ambientes pensados para estar em boa companhia. As imagens ajudam a apresentar a atmosfera desejada e não retratam um imóvel real anunciado pela Aori.'
    ],
    locationDescription: 'A Praia do Rosa, em Imbituba, é o cenário catarinense desta hospedagem fictícia. O anúncio ilustra uma proposta de estadia no litoral; não há endereço, mapa de um imóvel ou distância real até o mar.',
    rules: ['Entrada a partir das 15h', 'Saída até as 11h', 'Até 4 hóspedes', 'Não fumar nos ambientes internos', 'Respeitar o silêncio à noite']
  },
  {
    id: 'morada-das-oliveiras', name: 'Morada das Oliveiras', destination: 'campo',
    location: 'Rancho Queimado, SC', regionLabel: 'Campo catarinense', propertyType: 'Casa inteira',
    photo: '/assets/photos/stay-bedroom.jpg',
    photoAlt: 'Fotografia ilustrativa de uma hospedagem com madeira e materiais naturais',
    gallery: [
      { src: '/assets/photos/stay-bedroom.jpg', alt: 'Quarto com materiais naturais, em fotografia ilustrativa' },
      { src: '/assets/photos/stay-cabin.jpg', alt: 'Refúgio cercado pela natureza, em fotografia ilustrativa' },
      { src: '/assets/photos/brazil-mountains.jpg', alt: 'Paisagem verde e aberta, em fotografia ilustrativa' }
    ],
    tag: 'Encontros no campo', guests: 6, bedrooms: 3, bathrooms: 3, price: 1100,
    filters: ['natureza', 'familia'],
    description: 'Mesa cheia, conversa longa e o silêncio do campo.',
    amenities: ['Jardim', 'Lareira', 'Cozinha equipada', 'Três quartos'],
    story: 'Uma morada demonstrativa imaginada em Rancho Queimado para reunir quem faz parte da sua história. A ideia é trocar o relógio da cidade pelo tempo dos encontros e da natureza.',
    longDescription: [
      'A Morada das Oliveiras é uma casa fictícia no campo catarinense, imaginada para uma viagem em família ou entre amigos. Três quartos e uma cozinha acolhedora formam a base de dias vividos juntos.',
      'A experiência proposta convida a preparar uma refeição, conversar perto da lareira e aproveitar o jardim. Cada comodidade e fotografia faz parte da demonstração da interface, sem confirmar uma estrutura real disponível para reserva.'
    ],
    locationDescription: 'Rancho Queimado é o cenário de Santa Catarina escolhido para esta morada fictícia. A inspiração é o tempo do campo, as conversas longas e a vida ao ar livre. Esta seleção não informa um endereço de hospedagem real.',
    rules: ['Entrada a partir das 15h', 'Saída até as 11h', 'Até 6 hóspedes', 'Não fumar nos ambientes internos', 'Respeitar o silêncio à noite']
  },
  {
    id: 'atelie-da-colina', name: 'Ateliê da Colina', destination: 'campo',
    location: 'Alfredo Wagner, SC', regionLabel: 'Campo catarinense', propertyType: 'Cabana inteira',
    photo: '/assets/photos/stay-cabin.jpg',
    photoAlt: 'Fotografia ilustrativa de um refúgio cercado por uma paisagem natural',
    gallery: [
      { src: '/assets/photos/stay-cabin.jpg', alt: 'Refúgio em meio à natureza, em fotografia ilustrativa' },
      { src: '/assets/photos/stay-bedroom.jpg', alt: 'Quarto com decoração acolhedora, em fotografia ilustrativa' },
      { src: '/assets/photos/brazil-mountains.jpg', alt: 'Montanhas e paisagem verde, em fotografia ilustrativa' }
    ],
    tag: 'Design que acolhe', guests: 2, bedrooms: 1, bathrooms: 1, price: 560,
    filters: ['design', 'a-dois'],
    description: 'Um lugar para reparar nos pequenos detalhes.',
    amenities: ['Decoração autoral', 'Vista para o campo', 'Cafeteira', 'Espaço de leitura'],
    story: 'Um ateliê imaginado em Alfredo Wagner para quem encontra beleza no cotidiano: um objeto feito à mão, uma janela aberta e um fim de tarde que pede mais alguns minutos.',
    longDescription: [
      'O Ateliê da Colina é uma cabana fictícia para dois no campo catarinense. Sua proposta reúne materiais naturais, objetos com personalidade e espaços pequenos que convidam a desacelerar.',
      'Um canto de leitura, café sem pressa e tempo para olhar pela janela compõem a experiência imaginada. Esta página apresenta um conceito de estadia, com fotografias e comodidades ilustrativas para avaliação da Aori.'
    ],
    locationDescription: 'Alfredo Wagner é o cenário catarinense desta cabana fictícia. A inspiração é uma pausa voltada à contemplação e aos pequenos detalhes. Não há endereço exato ou propriedade real associada ao anúncio.',
    rules: ['Entrada a partir das 15h', 'Saída até as 11h', 'Até 2 hóspedes', 'Não fumar nos ambientes internos', 'Respeitar o silêncio à noite']
  }
];
