angular.module('mctrainer').controller('QuestionViewCtrl',
    function ($scope, $timeout, $ionicHistory, $stateParams, $ionicPopup, $state, $ionicNavBarDelegate, ModuleData) {
        var that = this;
        var index = 0;
        var maxCounter = 2; // Variable die festlegt wie oft eine Frage beantwortet wird bis sie als gemeistert gilt
        var module = ModuleData.findByName($stateParams.name); // Objekt der Fragen mit deren Antworten.
        var stats = ModuleData.getStatsForModule(module.moduleID);
        var answeredCounter = stats.questions[index];
        var answeredQuestions = 1;
        var failedAnswers = 0;

        while (answeredCounter >= maxCounter) { // While Frage gemeistert do index++ bis ungemeisterte Frage kommt
            index++;
            answeredCounter = stats.questions[index];
        }
        $timeout(function () {
            var nr = index + 1;
            $ionicNavBarDelegate.title($stateParams.name + " " + nr + "/" + module.questions.length);
        }, 500);
        this.question = module.questions[index].question;  // Anzeige der Frage
        this.answers = shuffle(Object.keys(module.questions[index].answers)); //Array der Antworten
        this.checked = {};  // Var zum Setzen der Checkbox-Haken
        this.isAnswered = false; // Var für Status ob Frage beantwortet wurde oder nicht.
        this.answered = {}; // Var für die Antworten des Benutzers
        this.isCorrect = []; // Array der richtigen Antworten als boolean
        var initKeyAnswer = module.questions[index].answers; // Antworten als anwort:boolean
        var answeredCorrect = false; // Var ob richtig geantwortet wurde.


        // (Checkboxwerte auf false/ Lösungschlüssel)  initialisieren
        for (var i = 0; i < this.answers.length; i++) {
            this.answered[i] = false;
            this.isCorrect[i] = initKeyAnswer[this.answers[i]];
        }

        /**
         * Überprüfen, ob die gewählte Antwort richtig ist.
         */
        this.check = function () {
            var tempCorrect = false;
            this.isAnswered = true;


            // Setzt die Haken der Checkboxen
            for (var i = 0; i < this.answers.length; i++) {
                if (this.answered[i] || this.isCorrect[i]) {
                    this.checked[i] = true;
                } else {
                    this.checked[i] = false;
                }
            }

            // prüft ob Eingabe dem Lösungsschlüssel übereinstimmt
            for (i = 0; i < this.answers.length; i++) {
                if (this.isCorrect[i] != this.answered[i]) {
                    failedAnswers++;
                    tempCorrect = false;
                    break;
                } else {
                    tempCorrect = true;
                }
            }
            answeredCorrect = tempCorrect;

            ModuleData.questionAnswered(module.moduleID, answeredCorrect, index);
        };


        /**
         * Zur nächsten Frage wechseln (nach der Prüfung)
         */
        this.nextQuestion = function () {
            // Index erhöhtt, Zähler für nächste Frage geladen
            index++;
            answeredCounter = stats.questions[index];

            //Vorgang von oben wird wiederholt bis nicht gemeisterte Frage kommt
            while (answeredCounter >= maxCounter) {
                index++;
                answeredCounter = stats.questions[index];
            }

            if (index == module.questions.length) { // Falls Ende des Fragenkatalogs errreicht
                var rightAnswers = answeredQuestions - failedAnswers;
                var quote = Math.floor((rightAnswers / answeredQuestions) * 100);
                if (this.checkWhetherMastered()) { // Und ALLE Fragen 6 mal beantwortet wurden
                    $ionicPopup.alert({ // Benutzer hinweisen - Alle Zähler zurücksetzen
                        title: 'Glückwunsch!',
                        template: 'Du hast alle Fragen gemeistert. Dein Zähler wurde zurückgesetzt.'
                    }).then(function () {
                        ModuleData.resetStats(true, module.moduleID);
                        $ionicNavBarDelegate.title("Home");
                        $state.go('modules');
                    });
                } else {
                    // wenn nicht alle Fragen gemeistert ->
                    // Popup mit Statistik über die aktuelle Runde anzeigen und zurück zu Home
                    $ionicPopup.alert({
                        title: 'Statistik dieser Lernrunde',
                        template: 'Anzahl der beantworteten Fragen: ' + answeredQuestions + '<br>' +
                        'Richtig beantwortet: ' + rightAnswers +
                        ' (' + quote + '%)'
                    }).then(function () {
                        $ionicNavBarDelegate.title("Home");
                        $state.go('modules');
                    });
                }
            } else { // andernfalls nächste Frage initialisieren
                answeredQuestions++;
                var nr = index + 1;
                $ionicNavBarDelegate.title($stateParams.name + " " + nr + "/" + module.questions.length);
                that.question = module.questions[index].question;  // Anzeige der Frage
                that.answers = Object.keys(module.questions[index].answers); //Array der Antworten
                that.checked = {};  // Var zum Setzen der Haken der Checkboxen
                that.isAnswered = false; // Var für Status ob Frage beantwortet wurde oder nicht.
                initKeyAnswer = module.questions[index].answers; // Antworten als anwort:boolean
                answeredCorrect = false; // Var ob richtig geantwortet wurde.

                // (Checkboxwerte auf false/ Lösungschlüssel)  initialisieren -------
                for (var i = 0; i < that.answers.length; i++) {
                    that.answered[i] = false;
                    that.isCorrect[i] = initKeyAnswer[that.answers[i]];
                }
            }
        };

        /**
         * Prüfen, ob alle Fragen schon 6 mal beantwortet wurden
         * @return boolean
         */
        this.checkWhetherMastered = function () {
            for (var i = 0; i < stats.questions.length; i++) {
                if (stats.questions[i] < maxCounter) {
                    return false;
                }
            }
            return true;
        };


        /*
         * Zeigt ein Alert-Fenster mit einer Statistik über alle Lernrunden.

        this.showAllStats = function () {
            var stats = ModuleData.getStatsForModule(module.moduleID);
            var percent = stats.questions_answered == 0 ? 0 :
                Math.floor((stats.correct_answers / stats.questions_answered) * 100);
            $ionicPopup.alert({
                title: 'Statistik aller Lernrunden',
                template: 'Anzahl der beantworteten Fragen: ' + stats.questions_answered + '<br>' +
                'Richtig beantwortet: ' + stats.correct_answers +
                ' (' + percent + '%)'
            });
        };
         */

        /**
         * Shuffle an array.
         * From http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
         *
         * @param array
         * @returns shuffled array
         */
        function shuffle(array) {
            var currentIndex = array.length, temporaryValue, randomIndex;

            // While there remain elements to shuffle...
            while (0 !== currentIndex) {

                // Pick a remaining element...
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex -= 1;

                // And swap it with the current element.
                temporaryValue = array[currentIndex];
                array[currentIndex] = array[randomIndex];
                array[randomIndex] = temporaryValue;
            }

            return array;
        }
    });