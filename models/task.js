'use strict';
module.exports = (sequelize, DataTypes) => {
    var Task = sequelize.define('Task', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: {
                args: true,
                msg: 'Story name already exists!'
            }
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        time:{
            type: DataTypes.INTEGER,
            allowNull:false,
        }
    });

    Task.associate = function(models){
        models.Task.belongsTo(models.Stories,{
            onDelete: "CASCADE",
            foreignKey: "stories_id",
            as: "Stories"
        });
        models.Task.belongsTo(models.User, {
            onDelete: "CASCADE",
            foreignKey: 'assigned_user',
            as: 'AssignedUser'
        });
    };

    return Task;
};