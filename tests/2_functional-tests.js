const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const myDB = require("../connection");
const server = require("../server");
const { ObjectId } = require("mongodb");

chai.use(chaiHttp);
chai.use(require("chai-json-schema"));

const issueSchema = {
  title: "issue schema v1",
  type: "object",
  required: [
    "_id",
    "issue_title",
    "issue_text",
    "created_on",
    "updated_on",
    "created_by",
    "assigned_to",
    "open",
    "status_text",
  ],
  properties: {
    _id: {
      type: "string",
    },
    issue_title: {
      type: "string",
    },
    issue_text: {
      type: "string",
    },
    created_on: {
      type: "string",
    },
    updated_on: {
      type: "string",
    },
    created_by: {
      type: "string",
    },
    assigned_to: {
      type: "string",
    },
    open: {
      type: "boolean",
    },
    status_text: {
      type: "string",
    },
  },
};

suite("Functional Tests", function () {
  const ids = [];

  test("Create an issue with every field: POST request to /api/issues/{project}", function (done) {
    chai
      .request(server)
      .keepOpen()
      .post("/api/issues/apitest")
      .send({
        issue_title: "Test_Issue_1",
        issue_text: "When we post data it has an error.",
        created_by: "agnivon",
        status_text: "In QA",
      })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.deepInclude(res.body, {
          issue_title: "Test_Issue_1",
          issue_text: "When we post data it has an error.",
          created_by: "agnivon",
          assigned_to: "",
          status_text: "In QA",
        });
        ids.push(new ObjectId(res.body._id));
        done();
      });
  });

  test("Create an issue with only required fields: POST request to /api/issues/{project}", function (done) {
    chai
      .request(server)
      .keepOpen()
      .post("/api/issues/apitest")
      .send({
        issue_title: "Test_Issue_2",
        issue_text: "When we post data it does not show.",
        created_by: "agnivon",
      })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.deepInclude(res.body, {
          issue_title: "Test_Issue_2",
          issue_text: "When we post data it does not show.",
          created_by: "agnivon",
          assigned_to: "",
          status_text: "",
        });
        ids.push(new ObjectId(res.body._id));
        done();
      });
  });

  test("Create an issue with missing required fields: POST request to /api/issues/{project}", function (done) {
    chai
      .request(server)
      .keepOpen()
      .post("/api/issues/apitest")
      .send({
        issue_title: "Test_Issue_3",
        issue_text: "When we post data it has an error.",
      })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: "required field(s) missing" });
        done();
      });
  });

  test("View issues on a project: GET request to /api/issues/{project}", function (done) {
    chai
      .request(server)
      .keepOpen()
      .get("/api/issues/apitest")
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.typeOf(res.body, "array");
        res.body.forEach((issue) => assert.jsonSchema(issue, issueSchema));
        done();
      });
  });

  test("View issues on a project with one filter: GET request to /api/issues/{project}", function (done) {
    chai
      .request(server)
      .keepOpen()
      .get("/api/issues/apitest")
      .query({ issue_title: "Test_Issue_2" })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.typeOf(res.body, "array");
        res.body.forEach((issue) =>
          assert.equal(issue.issue_title, "Test_Issue_2"),
        );
        done();
      });
  });

  test("View issues on a project with multiple filters: GET request to /api/issues/{project}", function (done) {
    chai
      .request(server)
      .keepOpen()
      .get("/api/issues/apitest")
      .query({ created_by: "agnivon", assigned_to: "" })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.typeOf(res.body, "array");
        res.body.forEach((issue) => {
          assert.equal(issue.created_by, "agnivon");
          assert.equal(issue.assigned_to, "");
        });
        done();
      });
  });

  test("Update one field on an issue: PUT request to /api/issues/{project}", function (done) {
    chai
      .request(server)
      .keepOpen()
      .post("/api/issues/apitest")
      .send({
        issue_title: "Test_Issue_4",
        issue_text: "Cannot post data.",
        created_by: "agnivon",
        status_text: "In QA",
      })
      .end(function (err, res) {
        ids.push(new ObjectId(res.body._id));
        chai
          .request(server)
          .keepOpen()
          .put("/api/issues/apitest")
          .send({
            _id: res.body._id,
            issue_title: "Test_Issue_444",
          })
          .end(function (err, res) {
            assert.deepEqual(res.body, {
              result: "successfully updated",
              _id: res.body._id,
            });
            done();
          });
      });
  });

  test("Update multiple fields on an issue: PUT request to /api/issues/{project}", function (done) {
    chai
      .request(server)
      .keepOpen()
      .post("/api/issues/apitest")
      .send({
        issue_title: "Test_Issue_5",
        issue_text: "Cannot do anything.",
        created_by: "agnivon",
        status_text: "In QA",
      })
      .end(function (err, res) {
        ids.push(new ObjectId(res.body._id));
        chai
          .request(server)
          .keepOpen()
          .put("/api/issues/apitest")
          .send({
            _id: res.body._id,
            issue_title: "Test_Issue_555",
            assigned_to: "agnivon",
          })
          .end(function (err, res) {
            assert.deepEqual(res.body, {
              result: "successfully updated",
              _id: res.body._id,
            });
            done();
          });
      });
  });

  test("Update an issue with missing _id: PUT request to /api/issues/{project}", function (done) {
    chai
      .request(server)
      .keepOpen()
      .post("/api/issues/apitest")
      .send({
        issue_title: "Test_Issue_6",
        issue_text: "Cannot do anything.",
        created_by: "agnivon",
        status_text: "In QA",
      })
      .end(function (err, res) {
        ids.push(new ObjectId(res.body._id));
        chai
          .request(server)
          .keepOpen()
          .put("/api/issues/apitest")
          .send({
            issue_title: "Test_Issue_666",
            assigned_to: "agnivon",
          })
          .end(function (err, res) {
            assert.deepEqual(res.body, { error: "missing _id" });
            done();
          });
      });
  });

  test("Update an issue with no fields to update: PUT request to /api/issues/{project}", function (done) {
    chai
      .request(server)
      .keepOpen()
      .post("/api/issues/apitest")
      .send({
        issue_title: "Test_Issue_7",
        issue_text: "Cannot do anything.",
        created_by: "agnivon",
        status_text: "In QA",
      })
      .end(function (err, res) {
        ids.push(new ObjectId(res.body._id));
        chai
          .request(server)
          .keepOpen()
          .put("/api/issues/apitest")
          .send({ _id: res.body._id })
          .end(function (err, res) {
            assert.deepEqual(res.body, {
              error: "no update field(s) sent",
              _id: res.body._id,
            });
            done();
          });
      });
  });

  test("Update an issue with missing _id: PUT request to /api/issues/{project}", function (done) {
    chai
      .request(server)
      .keepOpen()
      .post("/api/issues/apitest")
      .send({
        issue_title: "Test_Issue_8",
        issue_text: "Cannot do anything.",
        created_by: "agnivon",
        status_text: "In QA",
      })
      .end(function (err, res) {
        ids.push(new ObjectId(res.body._id));
        chai
          .request(server)
          .keepOpen()
          .put("/api/issues/apitest")
          .send({
            _id: "invalid id",
            issue_title: "Test_Issue_888",
            assigned_to: "agnivon",
          })
          .end(function (err, res) {
            assert.deepEqual(res.body, {
              error: "could not update",
              _id: res.body._id,
            });
            done();
          });
      });
  });

  test("Delete an issue: DELETE request to /api/issues/{project}", function (done) {
    chai
      .request(server)
      .keepOpen()
      .post("/api/issues/apitest")
      .send({
        issue_title: "Test_Issue_9",
        issue_text: "Cannot do anything.",
        created_by: "agnivon",
        status_text: "In QA",
      })
      .end(function (err, res) {
        ids.push(new ObjectId(res.body._id));
        chai
          .request(server)
          .keepOpen()
          .delete("/api/issues/apitest")
          .send({
            _id: res.body._id,
          })
          .end(function (err, res) {
            assert.deepEqual(res.body, {
              result: "successfully deleted",
              _id: res.body._id,
            });
            done();
          });
      });
  });

  test("Delete an issue with an invalid _id: DELETE request to /api/issues/{project}", function (done) {
    chai
      .request(server)
      .keepOpen()
      .post("/api/issues/apitest")
      .send({
        issue_title: "Test_Issue_10",
        issue_text: "Cannot do anything.",
        created_by: "agnivon",
        status_text: "In QA",
      })
      .end(function (err, res) {
        ids.push(new ObjectId(res.body._id));
        chai
          .request(server)
          .keepOpen()
          .delete("/api/issues/apitest")
          .send({
            _id: "invalid id",
          })
          .end(function (err, res) {
            assert.deepEqual(res.body, {
              error: "could not delete",
              _id: res.body._id,
            });
            done();
          });
      });
  });

  test("Delete an issue with missing _id: DELETE request to /api/issues/{project}", function (done) {
    chai
      .request(server)
      .keepOpen()
      .post("/api/issues/apitest")
      .send({
        issue_title: "Test_Issue_11",
        issue_text: "Cannot do anything.",
        created_by: "agnivon",
        status_text: "In QA",
      })
      .end(function (err, res) {
        ids.push(new ObjectId(res.body._id));
        chai
          .request(server)
          .keepOpen()
          .delete("/api/issues/apitest")
          .send({})
          .end(function (err, res) {
            assert.deepEqual(res.body, { error: "missing _id" });
            done();
          });
      });
  });

  after(async function () {
    myDB(async function (client) {
      const myDataBase = await client
        .db("fcc-issuetracker")
        .collection("issues");
      await myDataBase.deleteMany({
        project_name: "apitest",
        _id: { $in: ids },
      });
    });
  });
});
