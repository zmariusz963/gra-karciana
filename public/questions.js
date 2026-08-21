// Baza pytan: kategoria (polska/swiat) x poziom trudnosci (latwy/sredni/trudny)
// Kazde pytanie: { q, options: [4], correct: index poprawnej odpowiedzi }

const QUESTIONS = {
  polska: {
    latwy: [
      { q: 'Jaka jest stolica Polski?', options: ['Warszawa', 'Krakow', 'Gdansk', 'Poznan'], correct: 0 },
      { q: 'Jaka waluta obowiazuje w Polsce?', options: ['Zloty', 'Euro', 'Korona', 'Frank'], correct: 0 },
      { q: 'Jaka jest najdluzsza rzeka w Polsce?', options: ['Wisla', 'Odra', 'Warta', 'Bug'], correct: 0 },
      { q: 'Jakie kolory ma polska flaga?', options: ['Bialo-czerwone', 'Bialo-niebieskie', 'Czerwono-czarne', 'Zielono-biale'], correct: 0 },
      { q: 'Ile wojewodztw ma Polska?', options: ['16', '12', '20', '8'], correct: 0 },
      { q: 'Jaki jest najwyzszy szczyt Polski?', options: ['Rysy', 'Sniezka', 'Babia Gora', 'Giewont'], correct: 0 },
      { q: 'Nad jakim morzem lezy Polska?', options: ['Baltyckim', 'Polnocnym', 'Srodziemnym', 'Czarnym'], correct: 0 },
      { q: 'Jaki ptak jest symbolem narodowym Polski?', options: ['Orzel bialy', 'Bocian', 'Sokol', 'Golab'], correct: 0 },
      { q: 'W ktorym miescie znajduje sie Kopiec Kosciuszki?', options: ['Krakow', 'Warszawa', 'Wroclaw', 'Gdansk'], correct: 0 },
      { q: 'Kto napisal "Pana Tadeusza"?', options: ['Adam Mickiewicz', 'Juliusz Slowacki', 'Henryk Sienkiewicz', 'Boleslaw Prus'], correct: 0 },
      { q: 'Kiedy obchodzimy Swieto Niepodleglosci?', options: ['11 listopada', '3 maja', '1 maja', '15 sierpnia'], correct: 0 },
      { q: 'W jakim miescie urodzil sie Mikolaj Kopernik?', options: ['Torun', 'Krakow', 'Gdansk', 'Poznan'], correct: 0 },
      { q: 'Ktore polskie miasto ma najwiecej mieszkancow?', options: ['Warszawa', 'Krakow', 'Lodz', 'Wroclaw'], correct: 0 },
      { q: 'Jak nazywa sie najwyzsze pasmo gorskie w Polsce?', options: ['Tatry', 'Sudety', 'Beskidy', 'Bieszczady'], correct: 0 },
      { q: 'Jaki jest polski jezyk urzedowy w calym kraju?', options: ['Polski', 'Kaszubski', 'Slaski', 'Niemiecki'], correct: 0 },
    ],
    sredni: [
      { q: 'Kto byl pierwszym prezydentem III RP?', options: ['Wojciech Jaruzelski', 'Lech Walesa', 'Aleksander Kwasniewski', 'Lech Kaczynski'], correct: 0 },
      { q: 'W ktorym roku Polska wstapila do Unii Europejskiej?', options: ['2004', '1999', '2007', '2001'], correct: 0 },
      { q: 'Jak nazywa sie bitwa z 1920 roku zwana "cudem nad Wisla"?', options: ['Bitwa Warszawska', 'Bitwa pod Grunwaldem', 'Bitwa pod Wiedniem', 'Powstanie Warszawskie'], correct: 0 },
      { q: 'W ktorym roku wybuchlo Powstanie Warszawskie?', options: ['1944', '1943', '1945', '1939'], correct: 0 },
      { q: 'Kto namalowal obraz "Bitwa pod Grunwaldem"?', options: ['Jan Matejko', 'Stanislaw Wyspianski', 'Jacek Malczewski', 'Leon Wyczolkowski'], correct: 0 },
      { q: 'Ile lat trwaly rozbiory Polski, do odzyskania niepodleglosci w 1918?', options: ['123 lata', '100 lat', '150 lat', '200 lat'], correct: 0 },
      { q: 'Ktory polski kardynal zostal papiezem w 1978 roku?', options: ['Jan Pawel II', 'Benedykt XVI', 'Franciszek', 'Jan XXIII'], correct: 0 },
      { q: 'Jak nazywal sie polski zwiazek zawodowy powstaly w 1980 roku?', options: ['Solidarnosc', 'Prawworzadnosc', 'Wolnosc', 'Jednosc'], correct: 0 },
      { q: 'Ktore miasto bylo stolica Polski przed Warszawa?', options: ['Krakow', 'Gniezno', 'Poznan', 'Wroclaw'], correct: 0 },
      { q: 'Kto skomponowal "Poloneza A-dur"?', options: ['Fryderyk Chopin', 'Stanislaw Moniuszko', 'Karol Szymanowski', 'Ignacy Paderewski'], correct: 0 },
      { q: 'W ktorym roku wprowadzono w Polsce stan wojenny?', options: ['1981', '1980', '1982', '1979'], correct: 0 },
      { q: 'Ktory polski uczony sformulowal heliocentryczna teorie budowy Wszechswiata?', options: ['Mikolaj Kopernik', 'Jan Heweliusz', 'Maria Sklodowska-Curie', 'Kazimierz Funk'], correct: 0 },
      { q: 'Ilu polskich pisarzy zdobylo literacka Nagrode Nobla?', options: ['5', '3', '4', '2'], correct: 0 },
      { q: 'Ktory polski krol zwyciezyl w bitwie pod Grunwaldem w 1410 roku?', options: ['Wladyslaw Jagiello', 'Kazimierz Wielki', 'Jan III Sobieski', 'Boleslaw Chrobry'], correct: 0 },
      { q: 'Jan III Sobieski jest znany z odsieczy pod...', options: ['Wiedniem', 'Chocimiem', 'Grunwaldem', 'Kluszynem'], correct: 0 },
    ],
    trudny: [
      { q: 'W ktorym roku zawarto unie lubelska laczaca Polske i Litwe?', options: ['1569', '1385', '1596', '1543'], correct: 0 },
      { q: 'W ktorym roku uchwalono Konstytucje 3 Maja?', options: ['1791', '1789', '1795', '1772'], correct: 0 },
      { q: 'Ktory polski matematyk zlamal szyfr Enigmy przed II wojna swiatowa?', options: ['Marian Rejewski', 'Stefan Banach', 'Hugo Steinhaus', 'Waclaw Sierpinski'], correct: 0 },
      { q: 'W ktorym roku dokonano I rozbioru Polski?', options: ['1772', '1793', '1795', '1764'], correct: 0 },
      { q: 'Za panowania ktorego krola stolice Polski przeniesiono z Krakowa do Warszawy (1596)?', options: ['Zygmunta III Wazy', 'Stefana Batorego', 'Zygmunta Augusta', 'Wladyslawa IV'], correct: 0 },
      { q: 'Kto jest autorem "Trylogii" (Ogniem i mieczem, Potop, Pan Wolodyjowski)?', options: ['Henryk Sienkiewicz', 'Boleslaw Prus', 'Eliza Orzeszkowa', 'Stefan Zeromski'], correct: 0 },
      { q: 'Konstytucja 3 Maja z 1791 roku byla pierwsza w Europie i druga na swiecie po konstytucji...', options: ['USA', 'Francji', 'Anglii', 'Holandii'], correct: 0 },
      { q: 'Ktory wladca wprowadzil chrzest Polski w 966 roku?', options: ['Mieszko I', 'Boleslaw Chrobry', 'Kazimierz Odnowiciel', 'Boleslaw Krzywousty'], correct: 0 },
      { q: 'W jakim miescie podpisano traktat pokojowy konczacy wojne polsko-bolszewicka w 1921 roku?', options: ['Riga', 'Wersal', 'Brzesc', 'Minsk'], correct: 0 },
      { q: 'Ktora polska uczona odkryla promieniotworczosc wspolnie z mezem?', options: ['Maria Sklodowska-Curie', 'Emilia Sklodowska', 'Zofia Nalkowska', 'Ludwika Sniadecka'], correct: 0 },
      { q: 'Bitwa pod Kluszynem w 1610 roku byla zwyciestwem Polski nad...', options: ['Rosja', 'Szwecja', 'Turcja', 'Prusami'], correct: 0 },
      { q: 'Ktory architekt zaprojektowal Palac Kultury i Nauki w Warszawie?', options: ['Lew Rudniew', 'Bohdan Pniewski', 'Marian Spychalski', 'Zygmunt Stepinski'], correct: 0 },
      { q: 'W ktorym roku zakonczyl sie potop szwedzki traktatem w Oliwie?', options: ['1660', '1655', '1667', '1672'], correct: 0 },
      { q: 'Ktory polski poeta romantyczny napisal "Dziady"?', options: ['Adam Mickiewicz', 'Juliusz Slowacki', 'Zygmunt Krasinski', 'Cyprian Kamil Norwid'], correct: 0 },
      { q: 'Jak nazywal sie pakt z 1939 roku miedzy III Rzesza a ZSRR, ktory poprzedzil wybuch II wojny swiatowej?', options: ['Pakt Ribbentrop-Molotow', 'Traktat wersalski', 'Uklad monachijski', 'Pakt Kellogga-Brianda'], correct: 0 },
    ],
  },
  swiat: {
    latwy: [
      { q: 'Jaki jest najwiekszy kontynent na Ziemi?', options: ['Azja', 'Afryka', 'Europa', 'Ameryka Polnocna'], correct: 0 },
      { q: 'Jaka jest najdluzsza rzeka swiata?', options: ['Nil', 'Amazonka', 'Jangcy', 'Missisipi'], correct: 0 },
      { q: 'Jaka jest stolica Francji?', options: ['Paryz', 'Londyn', 'Berlin', 'Rzym'], correct: 0 },
      { q: 'Ile kontynentow jest na Ziemi?', options: ['7', '5', '6', '8'], correct: 0 },
      { q: 'Jaki jest najwiekszy ocean na Ziemi?', options: ['Spokojny', 'Atlantycki', 'Indyjski', 'Arktyczny'], correct: 0 },
      { q: 'Jaka jest stolica Japonii?', options: ['Tokio', 'Kioto', 'Osaka', 'Pekin'], correct: 0 },
      { q: 'Ktore panstwo ma najwieksza powierzchnie na swiecie?', options: ['Rosja', 'Kanada', 'Chiny', 'USA'], correct: 0 },
      { q: 'Ile planet krazy wokol Slonca w Ukladzie Slonecznym?', options: ['8', '9', '7', '10'], correct: 0 },
      { q: 'Jaka waluta obowiazuje w USA?', options: ['Dolar', 'Funt', 'Euro', 'Peso'], correct: 0 },
      { q: 'Jaka jest najwyzsza gora swiata?', options: ['Mount Everest', 'K2', 'Kilimandzaro', 'Mont Blanc'], correct: 0 },
      { q: 'Jaka jest stolica Wloch?', options: ['Rzym', 'Mediolan', 'Wenecja', 'Neapol'], correct: 0 },
      { q: 'Ktore zwierze nazywane jest "krolem zwierzat"?', options: ['Lew', 'Tygrys', 'Slon', 'Niedzwiedz'], correct: 0 },
      { q: 'Ktory kraj slynie z Wielkiego Muru?', options: ['Chiny', 'Japonia', 'Indie', 'Mongolia'], correct: 0 },
      { q: 'Jaka jest stolica Wielkiej Brytanii?', options: ['Londyn', 'Manchester', 'Liverpool', 'Edynburg'], correct: 0 },
      { q: 'Jaki jest najmniejszy kontynent na Ziemi?', options: ['Australia', 'Europa', 'Antarktyda', 'Ameryka Poludniowa'], correct: 0 },
    ],
    sredni: [
      { q: 'W ktorym roku zakonczyla sie II wojna swiatowa?', options: ['1945', '1944', '1946', '1943'], correct: 0 },
      { q: 'Ktory kraj podarowal USA Statue Wolnosci?', options: ['Francja', 'Wielka Brytania', 'Hiszpania', 'Wlochy'], correct: 0 },
      { q: 'Jaka jest stolica Australii?', options: ['Canberra', 'Sydney', 'Melbourne', 'Perth'], correct: 0 },
      { q: 'Ile panstw wchodzi w sklad Zjednoczonego Krolestwa?', options: ['4', '3', '5', '2'], correct: 0 },
      { q: 'Ktory staroytny cud swiata znajduje sie w Egipcie?', options: ['Piramidy w Gizie', 'Wiszace Ogrody Semiramidy', 'Kolos Rodyjski', 'Latarnia Aleksandryjska'], correct: 0 },
      { q: 'Kto namalowal "Mona Lise"?', options: ['Leonardo da Vinci', 'Michal Aniol', 'Rafael', 'Rembrandt'], correct: 0 },
      { q: 'Ktory kraj ma na mapie ksztalt buta?', options: ['Wlochy', 'Grecja', 'Hiszpania', 'Portugalia'], correct: 0 },
      { q: 'W ktorym roku upadl Mur Berlinski?', options: ['1989', '1991', '1985', '1990'], correct: 0 },
      { q: 'Ktore panstwo jest obecnie najbardziej zaludnione na swiecie?', options: ['Indie', 'Chiny', 'USA', 'Indonezja'], correct: 0 },
      { q: 'Ktory organ ONZ odpowiada za utrzymanie miedzynarodowego pokoju?', options: ['Rada Bezpieczenstwa', 'Zgromadzenie Ogolne', 'Trybunal', 'Sekretariat'], correct: 0 },
      { q: 'Ktory kraj jest najwiekszym producentem kawy na swiecie?', options: ['Brazylia', 'Kolumbia', 'Wietnam', 'Etiopia'], correct: 0 },
      { q: 'Jaki jest symbol chemiczny zlota?', options: ['Au', 'Ag', 'Fe', 'Pb'], correct: 0 },
      { q: 'Kto powszechnie uznawany jest za wynalazce zarowki?', options: ['Thomas Edison', 'Nikola Tesla', 'Alexander Graham Bell', 'James Watt'], correct: 0 },
      { q: 'Jaka jest stolica Kanady?', options: ['Ottawa', 'Toronto', 'Vancouver', 'Montreal'], correct: 0 },
      { q: 'Ktory kraj jako pierwszy wyslal czlowieka w kosmos?', options: ['ZSRR', 'USA', 'Chiny', 'Niemcy'], correct: 0 },
    ],
    trudny: [
      { q: 'W ktorym roku rozpoczela sie I wojna swiatowa?', options: ['1914', '1912', '1916', '1918'], correct: 0 },
      { q: 'Ktory traktat oficjalnie zakonczyl I wojne swiatowa?', options: ['Traktat wersalski', 'Traktat z Tordesillas', 'Pokoj westfalski', 'Traktat paryski'], correct: 0 },
      { q: 'Kto byl pierwszym cesarzem Rzymu?', options: ['Oktawian August', 'Juliusz Cezar', 'Neron', 'Kaligula'], correct: 0 },
      { q: 'Ktory filozof napisal dzielo "Panstwo" (Republika)?', options: ['Platon', 'Arystoteles', 'Sokrates', 'Pitagoras'], correct: 0 },
      { q: 'W ktorym roku Krzysztof Kolumb dotarl do Ameryki?', options: ['1492', '1500', '1488', '1512'], correct: 0 },
      { q: 'Ktory kraj jako pierwszy na swiecie przyznal kobietom prawa wyborcze (1893)?', options: ['Nowa Zelandia', 'USA', 'Wielka Brytania', 'Finlandia'], correct: 0 },
      { q: 'Ile wynosi w przyblizeniu predkosc swiatla w prozni?', options: ['300 000 km/s', '150 000 km/s', '1 000 000 km/s', '30 000 km/s'], correct: 0 },
      { q: 'Ktory uczony sformulowal ogolna teorie wzglednosci?', options: ['Albert Einstein', 'Isaac Newton', 'Niels Bohr', 'Max Planck'], correct: 0 },
      { q: 'Jak nazywala sie stolica Cesarstwa Bizantyjskiego (dzisiejszy Stambul)?', options: ['Konstantynopol', 'Ateny', 'Aleksandria', 'Antiochia'], correct: 0 },
      { q: 'Kto stworzyl uklad okresowy pierwiastkow w 1869 roku?', options: ['Dmitrij Mendelejew', 'Antoine Lavoisier', 'John Dalton', 'Maria Sklodowska-Curie'], correct: 0 },
      { q: 'W ktorym roku doszlo do zjednoczenia Niemiec po II wojnie swiatowej?', options: ['1990', '1989', '1991', '1988'], correct: 0 },
      { q: 'Ktory staroytny cud swiata jako jedyny przetrwal do dzis?', options: ['Piramidy w Gizie', 'Wiszace Ogrody Semiramidy', 'Posag Zeusa', 'Kolos Rodyjski'], correct: 0 },
      { q: 'Ile lat w przyblizeniu trwala wojna stuletnia miedzy Anglia a Francja?', options: ['116 lat', '100 lat', '50 lat', '75 lat'], correct: 0 },
      { q: 'Ktory kraj jako pierwszy wprowadzil na orbite sztucznego satelite (Sputnik, 1957)?', options: ['ZSRR', 'USA', 'Chiny', 'Wielka Brytania'], correct: 0 },
      { q: 'Ktory staroytny grecki matematyk stworzyl podstawy geometrii euklidesowej?', options: ['Euklides', 'Pitagoras', 'Archimedes', 'Talem'], correct: 0 },
    ],
  },
};

// Przetasuj opcje odpowiedzi tak, by poprawna nie byla zawsze na tej samej pozycji.
function shuffleOptions(question) {
  const correctText = question.options[question.correct];
  const opts = [...question.options];
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return { ...question, options: opts, correct: opts.indexOf(correctText) };
}

if (typeof module !== 'undefined') module.exports = { QUESTIONS, shuffleOptions };
