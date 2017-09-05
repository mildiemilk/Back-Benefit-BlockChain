import UserModel from './user';
import CompanyModel from './company';
import SimpleRequirementModel from './simpleRequirement';
import MasterPlanModel from './masterPlan';
import BiddingModel from './bidding';
import BiddingRelationModel from './biddingRelation';
import BenefitPlanModel from './benefit-plan';
import MediaModel from './media';
import RoleModel from './role';
import InsurerPlanModel from './insurer-plan';
import EmployeePlanModel from './employee-plan';
import TemplatePlanModel from './template-plan';

export const User = UserModel;
export const Company = CompanyModel;
export const SimpleRequirement = SimpleRequirementModel;
export const MasterPlan = MasterPlanModel;
export const Bidding = BiddingModel;
export const BiddingRelation = BiddingRelationModel;
export const BenefitPlan = BenefitPlanModel;
export const Media = MediaModel;
export const Role = RoleModel;
export const InsurerPlan = InsurerPlanModel;
export const EmployeePlan = EmployeePlanModel;
export const TemplatePlan = TemplatePlanModel;

export default {
  User,
  Company,
  SimpleRequirement,
  MasterPlan,
  Bidding,
  BiddingRelation,
  BenefitPlan,
  Media,
  Role,
  InsurerPlan,
  EmployeePlan,
  TemplatePlan,
};
