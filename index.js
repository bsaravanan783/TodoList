import express from "express";
import bodyParser from "body-parser";
import pg from "pg";


const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "todo database",
    password: "8508871712",
    port: 5432
});

db.connect();

const app = express();

const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());



app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let routes = [
    { id: 1, name: "listenmusic", description: "The description describes all about listening music", done: true, reoccuring: "not reoccuring" },
    { id: 2, name: "playcricket", description: "The description describes all about playing cricket", done: false, reoccuring: "not reoccuring" },
    { id: 3, name: "watchmovies", description: "The description describes all about watching movies", done: false, reoccuring: "not reoccuring" },
    { id: 4, name: "brush", description: "The description describes all about brushing your teeth", done: true, reoccuring: "reoccuring", reoccuringType: "daily" },
    { id: 5, name: "Breakfast", description: "The description describes all about eating breakfast", done: true, reoccuring: "reoccuring", reoccuringType: "weekly" }
];


app.listen(port, () => {
    console.log(`Successfully running on port ${port}`);
})




app.get("/routes", async (req, res) => {

    const result = await db.query("SELECT * FROM todo_table");

    console.log("result", result.rows);
    const response = result.rows.map((route, index) => `
    <div class="todo-item">
        <input type="text" value="${route.name}" name="updateTodoName" id="input${index}">
        </input>
        <label>Reoccuring:
            <input type="checkbox" class="hut" ${route.reoccuring === "reoccuring" ? "checked" : ""} id="checkbox${index}"  name="updateTodoReoccuring">
        </label>
        <button id="button${index}" hx-patch="" hx-trigger="click" onclick="updateTodo(${route.id}, ${index})" >Update</button>

        <button hx-delete="/todo/${route.id}" hx-trigger="click">Delete</button>
    </div>
`).join('');


    res.send(response);
})



app.get(`/todo/`, (req, res) => {
    const done = true;
    res.json(routes);
});


app.get("/todo/filter", (req, res) => {
    const done = req.query.doneFilter;
    console.log(done);

    // const { doneFilter } = req.body; // Access the value of the form field with the name "doneFilter"
    // console.log(doneFilter);

    let arrayAfterFiltering
    if (done === "true") {
        arrayAfterFiltering = routes.filter(item => item.done);
    } else if (done === "false") {
        arrayAfterFiltering = routes.filter(item => !item.done);
    } else {
        arrayAfterFiltering = [].concat(routes);
    }


    const response = arrayAfterFiltering.map(route => ({
        name: route.name,
        done: route.done,
        reoccuring: route.reoccuring,
        reoccuringType: route.reoccuringType
    }));




    // res.json(arrayAfterFiltering)
    res.json(response);


})






let reoccurringArray = [];
let intervalIdDaily;
let intervalIdWeekly;

const toggleDoneDaily = () => {
    reoccurringArray.filter(item => item.reoccuringType === "daily").forEach(item => {
        item.done = !item.done;
    });
    console.log("Daily Toggled", reoccurringArray.filter(item => item.reoccuringType === "daily"));
};

const toggleDoneWeekly = () => {
    reoccurringArray.filter(item => item.reoccuringType === "weekly").forEach(item => {
        item.done = !item.done;
    });
    console.log("Weekly Toggled", reoccurringArray.filter(item => item.reoccuringType === "weekly"));
};

const startToggling = (reoccuringType) => {
    clearInterval(intervalIdDaily);
    clearInterval(intervalIdWeekly);

    if (reoccuringType === "daily") {
        intervalIdDaily = setInterval(() => {
            toggleDoneDaily();
        }, 5000);
    }

    if (reoccuringType === "weekly") {
        intervalIdWeekly = setInterval(() => {
            toggleDoneWeekly();
        }, 10000);
    }
};

app.get("/todo/reocurring", (req, res) => {
    const { type, reoccuringType } = req.query;

    if (type === "true") {
        reoccurringArray = routes.filter(item => item.reoccuring === "reoccuring");
    } else {
        reoccurringArray = routes.filter(item => item.reoccuring === "notreoccuring");
    }

    if (reoccuringType === "daily" || reoccuringType === "weekly") {
        startToggling(reoccuringType);
    }

    if (type === "false") {
        res.json(routes.filter(item => item.reoccuring === "notreoccuring"));
    } else {
        res.json(reoccurringArray);
    }
});


app.get("/todo/:id", (req, res) => {
    const todoId = req.params.id;
    console.log(todoId);

    const extractedId = parseInt(todoId);
    console.log(extractedId);

    const result = routes.find(item => item.id === extractedId);
    if (result === undefined) {
        res.send("the item you have requested does not exist");
    }
    res.json(result);


});

// app.delete("/todo", (req, res) => {

app.delete("/todo/:id", async (req, res) => {
    const todoId = req.params.id;

    // const todoId = req.body.deleteTodoId;

    console.log(todoId);

    const extractedId = parseInt(todoId);

    const elementToBeRemoved = routes.find(item => item.id === extractedId);

    console.log("The El to be removed", elementToBeRemoved);
    const arrayAfterDeleting = routes.filter(item => item !== elementToBeRemoved);

    console.log(arrayAfterDeleting);


    // const indextoRemove = extractedId - 1;
    // console.log(indextoRemove);

    let isTrue = true;

    if (arrayAfterDeleting.length !== routes.length) {
        isTrue = true;
    }





    routes = routes.filter(item => arrayAfterDeleting.includes(item));

    console.log(arrayAfterDeleting);


    await db.query("DELETE FROM todo_table WHERE id = $1", [extractedId]);

    // res.json(routes);
    res.send("deleted");

})





app.delete("/todo/deleteall", (req, res) => {

    console.log("posasnsdf");
    routes.length = 0

    res.json(routes);

})



// app.patch("/todo", (req, res) => {
app.patch("/todo/:id", (req, res) => {
    // res.send("Patch successfully completed");

    const updateId = req.params.id;
    // const updateId = req.body.updateTodoId;

    let updatedName = req.query.updateTodoName;
    let updatedReoccuring = req.query.updateTodoReoccuring;

    const extractedId = parseInt(updateId);
    console.log(updateId);
    console.log("vvjsiog");

    let updatedDone = req.body.updateTodoDone;
    // let updatedName = req.body.updateTodoName;
    let updatedDescription = req.body.updateTodoDescription;
    // let updatedReoccuring = req.body.updateTodoReoccuring;
    let updatedReoccuringType = req.body.updateTodoReoccuringType;



    console.log(updatedDone);
    console.log(updatedName);
    console.log(updatedDescription);
    console.log(updatedReoccuring);
    console.log(updatedReoccuringType);

    console.log(extractedId);






    if (updatedReoccuring === "true") {
        routes.forEach(item => {
            if (item.id === extractedId) {
                item.reoccuring = "reoccuring";
            }
        });
    }
    if (updatedReoccuring === "false") {
        routes.forEach(item => {
            if (item.id === extractedId) {
                item.reoccuring = "not reoccuring";
            }
        });
    }


    if (updatedName) {
        routes.forEach(item => {
            if (item.id === extractedId) {
                item.name = updatedName;
            }
        });
    }
    if (updatedDone) {
        routes.forEach(item => {
            if (item.id === extractedId) {
                item.done = updatedDone;
            }
        });
    }

    if (updatedDescription) {
        routes.forEach(item => {
            if (item.id === extractedId) {
                item.description = updatedDescription;
            }
        });
    }



    if (updatedReoccuringType) {
        routes.forEach(item => {
            if (item.id === extractedId) {
                item.reoccuringType = updatedReoccuringType;
            }
        });
    }

    if (updatedReoccuring === "true") {
        updatedReoccuring = "reoccuring";
    } else {
        updatedReoccuring = "not reoccuring"
    }

    try {
        db.query("UPDATE todo_table SET name = ($1),reoccuring=($2) WHERE id = $3", [updatedName, updatedReoccuring, extractedId]);
    } catch (error) {
        console.log("ERROR OCCURRED WHILE PATCHING IN DB", error);
    }

    console.log("updated")

    console.log(routes);



    res.send("updated");



});




app.post("/todo", async (req, res) => {



    console.log("sfdnsjdfnk");
    const id = routes.length + 1;
    const name = req.body.newTodoName;
    const description = req.body.newTodoDescription;
    const done = req.body.newTodoDone;
    let reoccuring = req.body.newTodoReoccuring;
    let reoccuringType;

    console.log(id);
    console.log(name);
    console.log(done);

    if (reoccuring === "true") {
        reoccuring = "reoccuring";
        reoccuringType = req.body.newTodoReoccuringType;
    } else {
        reoccuringType = "none";
        reoccuring = "not reoccuring"
    }

    console.log(reoccuring);

    try {
        await db.query("INSERT INTO todo_table(name,reoccuring) VALUES($1,$2)", [name, reoccuring]);
    } catch (error) {
        console.log(error);
    }

    const newRoute = { id, name, description, done, reoccuring, reoccuringType };
    routes.push(newRoute);

    const result = await db.query("SELECT * FROM todo_table");


    const response = result.rows.map((route, index) => `
    <div class="todo-item">
        <input type="text" value="${route.name}" name="updateTodoName" id="input${index}">
        </input>
        <label>Reoccuring:
            <input type="checkbox" class="hut" ${route.reoccuring === "reoccuring" ? "checked" : ""} id="checkbox${index}"  name="updateTodoReoccuring">
        </label>
        <button id="button${index}" hx-patch="" hx-trigger="click" onclick="updateTodo(${route.id}, ${index})" >Update</button>

        <button hx-delete="/todo/${route.id}" hx-trigger="click">Delete</button>
    </div>
    `).join('');
    res.send(response);
});

{/* <div id="up${index}" class="emptydiv"></div> */ }



function remove(arr, indextoRemove) {

    console.log("works");

    const removedEl = arr.splice(indextoRemove, 1);
    console.log(removedEl);

    console.log(`there are ${removedEl.length} elements in the removedEl array`);
    if (removedEl.length === 1) {
        return true;


    } else {
        return false;
    }

}



app.put("/todo/:id", (req, res) => {
    const idToPut = req.params.id;
    console.log("hello")
    const id = parseInt(idToPut);
    const name = req.body.newTodoName;

    // const name = req.body.name;
    // const done = req.body.done;
    // const reoccuring = req.body.reoccuring;
    let reoccuring = req.body.newTodoReoccuring;

    if (reoccuring === "true") {
        reoccuring = "reoccuring";
        // reoccuringType = req.body.newTodoReoccuringType;
    } else {
        // reoccuringType = "none";
        reoccuring = "not reoccuring"
    }



    // const description = req.body.description;

    const updatedcontent = { id, name, reoccuring };

    console.log(toPut(id, updatedcontent));



    res.send("updated");

});



function toPut(idToPut, updatedcontent) {

    const index = routes.findIndex(item => item.id === idToPut);

    if (index !== -1) {
        routes[index] = updatedcontent
    }
};







