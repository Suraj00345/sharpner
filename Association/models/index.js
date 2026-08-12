const Student = require("./students");
const IdentityCard = require("./identitycard");
const department = require("./department");
const courses = require("./courses");
const studentCourses = require("./studentCourses");

// One-to-One Association
Student.hasOne(IdentityCard);
IdentityCard.belongsTo(Student);

//one to many
department.hasMany(Student);
Student.belongsTo(department);

//many to many assoiciation
Student.belongsToMany(courses, { through: studentCourses });
courses.belongsToMany(Student, { through: studentCourses });

module.exports = {
  Student,
  IdentityCard,
  courses,
  studentCourses,
};
