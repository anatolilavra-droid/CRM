import ( Router ) from "express";

const router = Router();

let tasks = [];
let nextId = 1;

router.get("/", (req, res) => {
    res.json(tasks);
});

router.post("/",(req,res)=> {
    const { title,done } = req.body;

    if (!title || typeof title !== "string") {
        return res.status(400).json({
            error:"title is required and must be a string"
        });

        const newTask = {
            id: nextId++,
            title,
            done:typeof done === "boolean" ? done: false,
        }
        taslks.push(newTask);
        res.status(201).json(newTask);
    }
});
export default router;
