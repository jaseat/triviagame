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

const DISPLAY_TIME = 5;
const WAIT_TIME = 5;

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
    },

    timeout: function(){
        clearInterval(this.timer);
        $("#display").html("Timeout");
        $("#display").append("<p>Correct Answer: "+this.questions[this.currentQuestion].a[this.questions[this.currentQuestion].c]+"</p>");
        this.unanswered++;
        this.time = WAIT_TIME;
        this.timer = setInterval(()=>{this.timerCallback()}, 1000);
    }, 
    displayQuestions: function(){
        clearInterval(this.timer);
        $("#display").empty();
        this.time = DISPLAY_TIME;
        $("#time").html(this.time);
        var newDiv = $("<div>");
        var q = $("<div>");
        q.addClass("question");
        q.html(this.questions[this.currentQuestion].q);
        newDiv.append(q);
        this.questions[this.currentQuestion].a.forEach((element, index) => {
            var a = $("<div>");
            a.html(element);
            a.attr("num", index);
            a.addClass("answer");
            newDiv.append(a);
        });
        $("#display").append(newDiv);
        
        this.timer = setInterval(()=>{this.timerCallback()}, 1000);
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
            $("#display").append("<p>Correct Answer: "+this.questions[this.currentQuestion].a[this.questions[this.currentQuestion].c]+"</p>");

        }
        this.time = WAIT_TIME;
        this.timer = setInterval(()=>{this.timerCallback()}, 1000);
    }
}

function parseQuestions(q){
    var qArray = [];
    q.forEach(element =>{
        // if(element.type === "multiple")
        {
            var qst = element.question;
            //get the number of answers
            var length = element.incorrect_answers.length + 1;
            //randomly choose a position to store the correct answer
            var random = Math.floor(Math.random() * length);
            var a = element.incorrect_answers;
            a.splice(random, 0, element.correct_answer);
            qArray.push(new Question(qst, a, random));
        }
    })
    return qArray;
}

$(document).ready(function(){
    var API_URL = "https://opentdb.com/api.php?amount=10"
    $(document).on("click", ".answer", game.click);
    $(document).on("click", ".start", ()=>{
        $.ajax({
            url: API_URL
        }).then(function(res){
            if(res.response_code === 0){
                game.questions = parseQuestions(res.results);
                game.begin();
            }
            else{
                alert("ERROR: API FAILED")
            }
        })
    })
    $(document).on("click", ".next", ()=>{
        game.update(KEY.TIMEOUT);
    })

    $.ajax({
        url: API_URL
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