//object to hold question and answers
var Question = function(q, a, c){
    //question
    this.q = q;
    //answers
    this.a = a;
    //correct answer
    this.c = c;
};

var STATE = Object.freeze({
    BEGIN: 0x1,
    QUESTION: 0x2,
    WAIT: 0x4,
    OVER: 0x8
});

var KEY = Object.freeze({
    TIMEOUT: 0x1,
    SELECT: 0x2
})

const DISPLAY_TIME = 2;
const WAIT_TIME = 2;

var game = {
    questions: [],
    currentQuestion: 0,
    correct: 0,
    incorrect: 0,
    unanswered: 0,
    time: 0,
    timer: null,
    selection: null,
    state: STATE.BEGIN,
    begin: function(){
        this.currentQuestion = 0;
        this.correct = 0;
        this.incorrect = 0;
        this.unanswered = 0;
        this.time = DISPLAY_TIME;
        this.state = STATE.QUESTION;

        $("#time").html(this.time);
        this.displayQuestions();
        
    },
    timerCallback: function(){
        $("#time").html(--(this.time));
        if(this.time === 0){
            this.update(KEY.TIMEOUT)
        }
    },
    update: function(input){
        switch(this.state){
            case STATE.QUESTION:
                if(input === KEY.TIMEOUT){
                    this.state = STATE.WAIT;
                    this.timeout();
                }
                else if (input === KEY.SELECT){
                    this.state = STATE.WAIT;
                    this.select();
                }
                break;
            case STATE.WAIT:
                if(input === KEY.TIMEOUT){
                    this.currentQuestion++;
                    if(this.currentQuestion === this.questions.length){
                        this.state = STATE.OVER;
                        this.over();
                    }
                    else{
                        this.state = STATE.QUESTION;
                        this.displayQuestions();
                    }
                }
                break;
        }
        console.log(this.state);
    },

    timeout: function(){
        clearInterval(this.timer);
        $("#display").html("Timeout");
        this.unanswered++;
        this.time = WAIT_TIME;
        this.timer = setInterval(()=>{this.timerCallback()}, 1000);
    }, 
    displayQuestions: function(){
        clearInterval(this.timer);
        $("#display").empty();
        this.time = DISPLAY_TIME;
        $("#time").html(this.time);
        var q = $("<div>");
        q.addClass("question");
        q.html(this.questions[this.currentQuestion].q);
        this.questions[this.currentQuestion].a.forEach((element, index) => {
            var a = $("<div>");
            a.html(element);
            a.attr("num", index);
            a.addClass("answer");
            q.append(a);
        });
        $("#display").append(q);
        
        //this.timer = setInterval(()=>{this.timerCallback()}, 1000);
    },
    over: function(){
        clearInterval(this.timer);
        $("#display").html("All done");
        var start = $("<div>");
        start.html("Start Over");
        start.addClass("start");
        $("#display").append("<p>Correct answers: " + this.correct+"</p>")
        $("#display").append("<p>Incorrect answers: " + this.incorrect+"</p>")
        $("#display").append("<p>Unanswered: " + this.unanswered+"</p>")
        $("#display").append(start);
    },

    click: function(){
        game.selection = $(this).attr("num");
        game.update(KEY.SELECT);
    },

    select: function(){
        clearInterval(this.timer);
        if (this.selection == this.questions[this.currentQuestion].c){
            this.correct++;
            $("#display").html("Correct!");
        }
        else{
            this.incorrect++;
            $("#display").html("Wrong!");
        }
        this.time = WAIT_TIME;
        this.timer = setInterval(()=>{this.timerCallback()}, 1000);
    }
}

function parseQuestions(q){
    var qArray = [];
    q.forEach(element =>{
        if(element.type === "multiple"){
            console.log(element.incorrect_answers);
            var qst = element.question;
            //get the number of answers
            var length = element.incorrect_answers.length + 1;
            //randomly choose a position to store the correct answer
            var random = Math.floor(Math.random() * length);
            var a = element.incorrect_answers;
            console.log(a);
            a.splice(random, 0, element.correct_answer);
            console.log(a);
            qArray.push(new Question(qst, a, random));
        }
    })
    console.log(qArray);
    return qArray;
}
var questions = [];

$(document).ready(function(){
    var q1, q2, q3;
    
    q1 = new Question("Q1", ["A1", "A2", "A3", "A4"], 0);
    q2 = new Question("Q2", ["A1", "A2", "A3", "A4"], 1);
    q3 = new Question("Q3", ["A1", "A2", "A3", "A4"], 2);
    game.questions.push(q1);
    game.questions.push(q2);
    game.questions.push(q3);
    $(document).on("click", ".answer", game.click);
    $(document).on("click", ".start", ()=>{
        game.begin();
    })

    $.ajax({
        url: "https://opentdb.com/api.php?amount=10"
    }).then(function(res){
        if(res.response_code === 0){
            game.questions = parseQuestions(res.results);
            game.begin();
        }
        else{
            alert("ERROR: API FAILED")
        }
    })

    
});