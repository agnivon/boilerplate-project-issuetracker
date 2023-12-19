"use strict";

const ObjectId = require("mongodb").ObjectId;

module.exports = function (app, myDb) {
  // app.use("/api/issues/:project", async (req, res, next) => {
  //   const project = req.params.project;

  //   try {
  //     await myDb.updateOne(
  //       { project_name: project },
  //       { $setOnInsert: { project_name: project, issues: [] } },
  //       { upsert: true },
  //     );
  //     return next();
  //   } catch (e) {
  //     return res.status(500).send("Project Creation Failed");
  //   }
  // });

  app
    .route("/api/issues/:project")

    .get(async function (req, res) {
      let project = req.params.project;
      let queryDocument = { project_name: project, ...req.query };
      //console.log(queryDocument);
      try {
        const issues = await myDb
          .find(queryDocument)
          .project({ project_name: 0 })
          .toArray();
        //console.log(issues);
        return res.json(issues);
      } catch (e) {
        return res.status(500).send(e.message);
      }
    })

    .post(async function (req, res) {
      let project = req.params.project;

      const {
        issue_title,
        issue_text,
        created_by,
        assigned_to = "",
        status_text = "",
      } = req.body;

      if (issue_title && issue_text && created_by) {
        try {
          const result = await myDb.insertOne({
            project_name: project,
            issue_title,
            issue_text,
            created_by,
            created_on: new Date(),
            updated_on: new Date(),
            created_by,
            assigned_to,
            open: true,
            status_text,
          });
          return res.json(await myDb.findOne({ _id: result.insertedId }));
        } catch (e) {
          console.log(e);
          return res.status(500).send(e.message);
        }
      } else {
        return res.json({ error: "required field(s) missing" });
      }
    })

    .put(async function (req, res) {
      let project = req.params.project;

      const { _id } = req.body;

      if (!_id) return res.json({ error: "missing _id" });

      let updateDocument = {};
      let updateFieldsPresent = false;

      Object.keys(req.body).forEach((key) => {
        if (
          [
            "issue_title",
            "issue_text",
            "created_by",
            "assigned_to",
            "status_text",
          ].includes(key) &&
          req.body[key] !== ""
        ) {
          updateDocument[key] = req.body[key];
          updateFieldsPresent = true;
        }
      });

      if (req.body["open"] === "false") {
        updateDocument["open"] = false;
      }
      // } else {
      //   updateDocument["open"] = true;
      // }

      if (updateFieldsPresent) {
        try {
          const result = await myDb.updateOne(
            { project_name: project, _id: new ObjectId(_id) },
            {
              $set: {
                ...updateDocument,
                updated_on: new Date(),
              },
            },
          );
          if (result.modifiedCount > 0) {
            return res.json({ result: "successfully updated", _id: _id });
          } else {
            return res.json({ error: "could not update", _id: _id });
          }
        } catch (e) {
          console.log(e);
          return res.json({ error: "could not update", _id: _id });
        }
      } else {
        return res.json({ error: "no update field(s) sent", _id: _id });
      }
    })

    .delete(async function (req, res) {
      let project = req.params.project;

      const { _id } = req.body;

      if (!_id) return res.json({ error: "missing _id" });

      try {
        const result = await myDb.deleteOne({
          project_name: project,
          _id: new ObjectId(_id),
        });
        if (result.deletedCount > 0) {
          return res.json({ result: "successfully deleted", _id: _id });
        } else {
          return res.json({ error: "could not delete", _id: _id });
        }
      } catch (e) {
        console.log(e);
        return res.json({ error: "could not delete", _id: _id });
      }
    });
};
